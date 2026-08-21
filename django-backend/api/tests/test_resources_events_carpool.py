"""Resource, carpool, and event flow tests."""

import datetime as dt

import pytest
from django.utils import timezone

from api.models import CarpoolRide, Event, Resource

pytestmark = pytest.mark.django_db


# ── Resources ──────────────────────────────────────────────────────────────
def test_create_and_list_resources(auth_client):
    res = auth_client.post(
        "/api/resources/",
        {"name": "Drill", "category": "tools", "description": "18V", "location": "Block A"},
    )
    assert res.status_code == 201
    listed = auth_client.get("/api/resources/")
    assert listed.data["count"] == 1


def test_request_resource_notifies_owner(auth_client, other_user):
    resource = Resource.objects.create(owner=other_user, name="Ladder", category="tools")
    res = auth_client.post(f"/api/resources/{resource.id}/request/", {"message": "Please?"})
    assert res.status_code == 201
    assert other_user.notifications.filter(notification_type="resource").exists()


def test_cannot_request_own_resource(auth_client, user):
    resource = Resource.objects.create(owner=user, name="Mine", category="other")
    res = auth_client.post(f"/api/resources/{resource.id}/request/")
    assert res.status_code == 400


# ── Events ───────────────────────────────────────────────────────────────────
def _future_event(organizer):
    return Event.objects.create(
        organizer=organizer,
        title="Cleanup",
        category="cleanup",
        date=timezone.localdate() + dt.timedelta(days=3),
        start_time=dt.time(9, 0),
        location="Park",
        max_attendees=2,
    )


def test_join_and_leave_event(auth_client, other_user):
    event = _future_event(other_user)
    joined = auth_client.post(f"/api/events/{event.id}/join/")
    assert joined.status_code == 200
    assert joined.data["is_attending"] is True
    assert joined.data["attendee_count"] == 1
    left = auth_client.post(f"/api/events/{event.id}/leave/")
    assert left.data["is_attending"] is False
    assert left.data["attendee_count"] == 0


def test_event_capacity_enforced(auth_client, make_user, other_user):
    event = _future_event(other_user)
    # Fill the 2 seats with other members.
    for name in ("x", "y"):
        from rest_framework.authtoken.models import Token

        member = make_user(username=name)
        token = Token.objects.get_or_create(user=member)[0]
        from rest_framework.test import APIClient

        c = APIClient()
        c.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        assert c.post(f"/api/events/{event.id}/join/").status_code == 200
    # The 3rd (auth_client's user) should be refused.
    res = auth_client.post(f"/api/events/{event.id}/join/")
    assert res.status_code == 400


# ── Carpool ──────────────────────────────────────────────────────────────────
def test_offer_ride_and_request_to_join(auth_client, other_user):
    ride = CarpoolRide.objects.create(
        user=other_user,
        ride_type="offer",
        origin="Maple Grove",
        destination="Downtown",
        date=timezone.localdate() + dt.timedelta(days=1),
        time=dt.time(8, 0),
        seats=2,
    )
    res = auth_client.post(f"/api/rides/{ride.id}/request/", {"seats": 1, "message": "Join?"})
    assert res.status_code == 201
    assert other_user.notifications.filter(notification_type="carpool").exists()


def test_ride_matching_returns_opposite_type(auth_client, user, other_user):
    today = timezone.localdate() + dt.timedelta(days=2)
    offer = CarpoolRide.objects.create(
        user=user, ride_type="offer", origin="Maple Grove", destination="Airport",
        date=today, time=dt.time(6, 0), seats=2,
    )
    CarpoolRide.objects.create(
        user=other_user, ride_type="request", origin="Maple Grove", destination="Airport",
        date=today, time=dt.time(6, 0), seats=1,
    )
    res = auth_client.get(f"/api/rides/{offer.id}/matches/")
    assert res.status_code == 200
    assert len(res.data) == 1
    assert res.data[0]["ride_type"] == "request"

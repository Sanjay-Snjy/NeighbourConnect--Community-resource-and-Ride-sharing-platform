"""Authentication flow tests."""

import pytest

pytestmark = pytest.mark.django_db

REGISTER = "/api/auth/register/"
LOGIN = "/api/auth/login/"
LOGOUT = "/api/auth/logout/"
ME = "/api/auth/me/"


def test_register_creates_user_and_returns_token(api_client):
    payload = {
        "full_name": "Nina Patel",
        "username": "nina",
        "email": "nina@example.com",
        "password": "Neighbour!2025",
        "confirm_password": "Neighbour!2025",
        "neighborhood": "Maple Grove",
    }
    res = api_client.post(REGISTER, payload)
    assert res.status_code == 201
    assert "token" in res.data
    assert res.data["user"]["username"] == "nina"
    assert res.data["user"]["profile"]["neighborhood"] == "Maple Grove"


def test_register_rejects_password_mismatch(api_client):
    payload = {
        "full_name": "Nina Patel",
        "username": "nina2",
        "email": "nina2@example.com",
        "password": "Neighbour!2025",
        "confirm_password": "different",
    }
    res = api_client.post(REGISTER, payload)
    assert res.status_code == 400


def test_login_with_email_and_username(api_client, make_user):
    make_user(username="carol", password="demopass123")
    by_username = api_client.post(LOGIN, {"identifier": "carol", "password": "demopass123"})
    by_email = api_client.post(LOGIN, {"identifier": "carol@example.com", "password": "demopass123"})
    assert by_username.status_code == 200
    assert by_email.status_code == 200
    assert by_username.data["token"]


def test_login_rejects_bad_credentials(api_client, make_user):
    make_user(username="carol")
    res = api_client.post(LOGIN, {"identifier": "carol", "password": "wrong"})
    assert res.status_code == 400


def test_me_requires_authentication(api_client):
    assert api_client.get(ME).status_code == 401


def test_me_returns_current_user(auth_client, user):
    res = auth_client.get(ME)
    assert res.status_code == 200
    assert res.data["username"] == user.username


def test_logout_invalidates_token(auth_client):
    assert auth_client.post(LOGOUT).status_code == 204
    # Token is now gone → subsequent request is unauthorized.
    assert auth_client.get(ME).status_code == 401


def test_profile_update(auth_client):
    res = auth_client.patch("/api/users/me/", {"bio": "Hello neighbors", "neighborhood": "Willow Creek"})
    assert res.status_code == 200
    assert res.data["profile"]["bio"] == "Hello neighbors"

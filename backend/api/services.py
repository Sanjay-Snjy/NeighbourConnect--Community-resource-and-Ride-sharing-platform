"""
Business logic for NeighbourHub.

Views stay thin by delegating cross-cutting behavior (notification fan-out,
ride matching, poll vote handling, conversation lookup) to these helpers.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

from .models import (
    CarpoolRide,
    Conversation,
    Like,
    Notification,
    Poll,
    PollOption,
    PollVote,
)

User = get_user_model()


# ── Notifications ───────────────────────────────────────────────────────────
def notify(
    *,
    recipient,
    notification_type: str,
    title: str,
    body: str = "",
    link: str = "",
    actor=None,
) -> Notification | None:
    """Create a notification, skipping self-directed noise."""
    if actor is not None and actor == recipient:
        return None
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        title=title,
        body=body,
        link=link,
    )


def notify_like(post, actor) -> None:
    notify(
        recipient=post.author,
        actor=actor,
        notification_type=Notification.Type.LIKE,
        title=f"{_name(actor)} liked your post",
        body=_snippet(post.content),
        link="/app/feed",
    )


def notify_comment(post, actor, comment) -> None:
    notify(
        recipient=post.author,
        actor=actor,
        notification_type=Notification.Type.COMMENT,
        title=f"{_name(actor)} commented on your post",
        body=_snippet(comment.content),
        link="/app/feed",
    )


def notify_resource_request(resource_request) -> None:
    resource = resource_request.resource
    notify(
        recipient=resource.owner,
        actor=resource_request.requester,
        notification_type=Notification.Type.RESOURCE,
        title=f"{_name(resource_request.requester)} requested “{resource.name}”",
        body=_snippet(resource_request.message),
        link="/app/resources",
    )


def notify_ride_request(ride_request) -> None:
    ride = ride_request.ride
    notify(
        recipient=ride.user,
        actor=ride_request.requester,
        notification_type=Notification.Type.CARPOOL,
        title=f"{_name(ride_request.requester)} wants to join your ride",
        body=f"{ride.origin} → {ride.destination}",
        link="/app/carpool",
    )


def notify_ride_response(ride_request) -> None:
    ride = ride_request.ride
    verb = "accepted" if ride_request.status == "accepted" else "declined"
    notify(
        recipient=ride_request.requester,
        actor=ride.user,
        notification_type=Notification.Type.CARPOOL,
        title=f"Your ride request was {verb}",
        body=f"{ride.origin} → {ride.destination}",
        link="/app/carpool",
    )


def notify_event_join(event, attendee) -> None:
    notify(
        recipient=event.organizer,
        actor=attendee,
        notification_type=Notification.Type.EVENT_INVITE,
        title=f"{_name(attendee)} joined “{event.title}”",
        body=f"{event.attendee_count} attending",
        link="/app/events",
    )


def notify_message(message) -> None:
    conversation = message.conversation
    for participant in conversation.participants.exclude(pk=message.sender_id):
        notify(
            recipient=participant,
            actor=message.sender,
            notification_type=Notification.Type.MESSAGE,
            title=f"New message from {_name(message.sender)}",
            body=_snippet(message.content),
            link="/app/messages",
        )


def notify_notice(notice) -> None:
    """Fan a community notice out to everyone except its author."""
    recipients = User.objects.exclude(pk=notice.author_id).filter(is_active=True)
    Notification.objects.bulk_create(
        [
            Notification(
                recipient=user,
                actor=notice.author,
                notification_type=Notification.Type.NOTICE,
                title=f"Notice: {notice.title}",
                body=_snippet(notice.description),
                link="/app/notices",
            )
            for user in recipients
        ]
    )


# ── Likes ───────────────────────────────────────────────────────────────────
@transaction.atomic
def toggle_like(post, user) -> bool:
    """Like or unlike a post. Returns True if now liked, False if unliked."""
    like, created = Like.objects.get_or_create(post=post, user=user)
    if not created:
        like.delete()
        return False
    notify_like(post, user)
    return True


# ── Polls ─────────────────────────────────────────────────────────────────────
@transaction.atomic
def vote_poll(poll: Poll, user, option_ids: list[int]) -> None:
    """Register a user's poll vote(s), respecting single/multiple choice."""
    from rest_framework.exceptions import ValidationError

    if poll.is_closed:
        raise ValidationError("This poll is closed.")

    valid_ids = set(
        PollOption.objects.filter(poll=poll, id__in=option_ids).values_list(
            "id", flat=True
        )
    )
    if not valid_ids:
        raise ValidationError("Select at least one valid option.")
    if not poll.allows_multiple and len(valid_ids) > 1:
        raise ValidationError("This poll only allows a single choice.")

    # Reset this user's prior votes on the poll, then record new ones.
    PollVote.objects.filter(poll=poll, user=user).delete()
    PollVote.objects.bulk_create(
        [
            PollVote(poll=poll, option_id=option_id, user=user)
            for option_id in valid_ids
        ]
    )


# ── Carpool matching ──────────────────────────────────────────────────────────
def match_rides(ride: CarpoolRide):
    """Find complementary carpool listings for a given ride.

    An *offer* is matched against *requests* on the same date sharing origin or
    destination keywords (and vice versa). Simple, explainable heuristic.
    """
    opposite = (
        CarpoolRide.RideType.REQUEST
        if ride.ride_type == CarpoolRide.RideType.OFFER
        else CarpoolRide.RideType.OFFER
    )
    qs = CarpoolRide.objects.filter(
        ride_type=opposite,
        date=ride.date,
        status=CarpoolRide.Status.ACTIVE,
    ).exclude(user=ride.user)

    origin_kw = ride.origin.split(",")[0].strip()
    dest_kw = ride.destination.split(",")[0].strip()
    return qs.filter(
        Q(origin__icontains=origin_kw) | Q(destination__icontains=dest_kw)
    ).select_related("user")[:20]


# ── Conversations ─────────────────────────────────────────────────────────────
def get_or_create_direct_conversation(user_a, user_b) -> Conversation:
    """Return the existing 1:1 conversation between two users, or create one."""
    existing = (
        Conversation.objects.filter(participants=user_a)
        .filter(participants=user_b)
        .first()
    )
    if existing:
        return existing
    conversation = Conversation.objects.create()
    conversation.participants.add(user_a, user_b)
    return conversation


# ── Helpers ───────────────────────────────────────────────────────────────────
def _name(user) -> str:
    return (user.get_full_name() or user.username) if user else "Someone"


def _snippet(text: str, length: int = 120) -> str:
    text = (text or "").strip()
    return text if len(text) <= length else text[: length - 1] + "…"

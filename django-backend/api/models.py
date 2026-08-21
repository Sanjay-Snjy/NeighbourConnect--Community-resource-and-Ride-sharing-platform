"""
Database models for NeighbourHub.

Design notes
------------
* Authentication uses Django's built-in ``User`` (referenced via
  ``settings.AUTH_USER_MODEL``); per-user community data lives on ``Profile``.
* Each domain (feed, resources, carpool, events, messaging, notices) is modeled
  with small, normalized tables and explicit status fields rather than one giant
  model.
* Timestamps, ordering, indexes, and unique constraints are declared where they
  matter for correctness and query performance.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from .validators import validate_image_file

User = settings.AUTH_USER_MODEL


# ─────────────────────────────────────────────────────────────────────────────
# Profile
# ─────────────────────────────────────────────────────────────────────────────
class Profile(models.Model):
    """Extended, per-user community profile."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    bio = models.CharField(max_length=280, blank=True)
    neighborhood = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["neighborhood"])]

    def __str__(self) -> str:
        return f"Profile<{self.user}>"


# ─────────────────────────────────────────────────────────────────────────────
# Community feed: Post, Comment, Like, Poll, PollOption, PollVote
# ─────────────────────────────────────────────────────────────────────────────
class Post(models.Model):
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="posts"
    )
    content = models.TextField(max_length=5000, blank=True)
    image = models.ImageField(
        upload_to="posts/",
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["author", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Post<{self.pk} by {self.author}>"

    @property
    def like_count(self) -> int:
        return self.likes.count()

    @property
    def comment_count(self) -> int:
        return self.comments.count()


class Comment(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="comments"
    )
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["post", "created_at"])]

    def __str__(self) -> str:
        return f"Comment<{self.pk} on Post {self.post_id}>"


class Like(models.Model):
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="likes"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="likes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user"], name="unique_post_like"
            )
        ]
        indexes = [models.Index(fields=["post", "user"])]

    def __str__(self) -> str:
        return f"Like<{self.user} → Post {self.post_id}>"


class Poll(models.Model):
    """A poll attached to a post (a post has at most one poll)."""

    post = models.OneToOneField(
        Post, on_delete=models.CASCADE, related_name="poll"
    )
    question = models.CharField(max_length=255)
    allows_multiple = models.BooleanField(default=False)
    closes_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Poll<{self.pk}: {self.question[:40]}>"

    @property
    def is_closed(self) -> bool:
        return bool(self.closes_at and self.closes_at <= timezone.now())

    @property
    def total_votes(self) -> int:
        return PollVote.objects.filter(option__poll=self).count()


class PollOption(models.Model):
    poll = models.ForeignKey(
        Poll, on_delete=models.CASCADE, related_name="options"
    )
    text = models.CharField(max_length=120)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self) -> str:
        return f"PollOption<{self.pk}: {self.text[:30]}>"

    @property
    def vote_count(self) -> int:
        return self.votes.count()


class PollVote(models.Model):
    poll = models.ForeignKey(
        Poll, on_delete=models.CASCADE, related_name="votes"
    )
    option = models.ForeignKey(
        PollOption, on_delete=models.CASCADE, related_name="votes"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="poll_votes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["option", "user"], name="unique_option_vote"
            )
        ]
        indexes = [models.Index(fields=["poll", "user"])]

    def __str__(self) -> str:
        return f"PollVote<{self.user} → Option {self.option_id}>"


# ─────────────────────────────────────────────────────────────────────────────
# Resource sharing
# ─────────────────────────────────────────────────────────────────────────────
class Resource(models.Model):
    class Category(models.TextChoices):
        BOOKS = "books", "Books"
        TOOLS = "tools", "Tools"
        SPORTS = "sports", "Sports"
        FOOD = "food", "Food"
        OTHER = "other", "Other"

    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="resources"
    )
    name = models.CharField(max_length=140)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER
    )
    description = models.TextField(max_length=2000, blank=True)
    image = models.ImageField(
        upload_to="resources/",
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    location = models.CharField(max_length=140, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["category", "-created_at"]),
            models.Index(fields=["is_available"]),
        ]

    def __str__(self) -> str:
        return f"Resource<{self.name}>"


class ResourceRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        COMPLETED = "completed", "Completed"

    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name="requests"
    )
    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="resource_requests"
    )
    message = models.CharField(max_length=500, blank=True)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["resource", "requester"],
                condition=models.Q(status="pending"),
                name="unique_pending_resource_request",
            )
        ]

    def __str__(self) -> str:
        return f"ResourceRequest<{self.requester} → {self.resource_id}>"


# ─────────────────────────────────────────────────────────────────────────────
# Carpool
# ─────────────────────────────────────────────────────────────────────────────
class CarpoolRide(models.Model):
    """A carpool listing — either an offered ride or a ride request.

    ``ride_type`` distinguishes the two; ``seats`` means "available seats" for an
    offer and "passengers needed" for a request. Requests to *join* an offer are
    modeled separately by :class:`RideRequest`.
    """

    class RideType(models.TextChoices):
        OFFER = "offer", "Offering a ride"
        REQUEST = "request", "Requesting a ride"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        FULL = "full", "Full"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="rides"
    )
    ride_type = models.CharField(
        max_length=10, choices=RideType.choices, default=RideType.OFFER
    )
    origin = models.CharField(max_length=160)
    destination = models.CharField(max_length=160)
    date = models.DateField()
    time = models.TimeField()
    seats = models.PositiveSmallIntegerField(default=1)
    notes = models.CharField(max_length=500, blank=True)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "time"]
        indexes = [
            models.Index(fields=["ride_type", "date"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"CarpoolRide<{self.origin} → {self.destination} ({self.ride_type})>"

    @property
    def seats_taken(self) -> int:
        return sum(
            r.seats
            for r in self.ride_requests.all()
            if r.status == RideRequest.Status.ACCEPTED
        )

    @property
    def seats_available(self) -> int:
        return max(self.seats - self.seats_taken, 0)


class RideRequest(models.Model):
    """A request to join a specific carpool ride."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    ride = models.ForeignKey(
        CarpoolRide, on_delete=models.CASCADE, related_name="ride_requests"
    )
    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="ride_requests"
    )
    seats = models.PositiveSmallIntegerField(default=1)
    message = models.CharField(max_length=500, blank=True)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["ride", "requester"], name="unique_ride_request"
            )
        ]

    def __str__(self) -> str:
        return f"RideRequest<{self.requester} → Ride {self.ride_id}>"


# ─────────────────────────────────────────────────────────────────────────────
# Events
# ─────────────────────────────────────────────────────────────────────────────
class Event(models.Model):
    class Category(models.TextChoices):
        CLEANUP = "cleanup", "Community Cleanup"
        SPORTS = "sports", "Sports"
        MEETING = "meeting", "Neighborhood Meeting"
        FESTIVAL = "festival", "Festival"
        WORKSHOP = "workshop", "Workshop"
        STUDY = "study", "Study Group"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    organizer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="events"
    )
    title = models.CharField(max_length=160)
    description = models.TextField(max_length=4000, blank=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    location = models.CharField(max_length=200)
    image = models.ImageField(
        upload_to="events/",
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    max_attendees = models.PositiveIntegerField(
        blank=True, null=True, help_text="Leave blank for unlimited."
    )
    is_public = models.BooleanField(default=True)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.SCHEDULED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "start_time"]
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["category", "date"]),
            models.Index(fields=["is_public", "status"]),
        ]

    def __str__(self) -> str:
        return f"Event<{self.title}>"

    @property
    def attendee_count(self) -> int:
        return self.bookings.count()

    @property
    def is_full(self) -> bool:
        return bool(self.max_attendees and self.attendee_count >= self.max_attendees)


class EventBooking(models.Model):
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="bookings"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="event_bookings"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "user"], name="unique_event_booking"
            )
        ]

    def __str__(self) -> str:
        return f"EventBooking<{self.user} → Event {self.event_id}>"


# ─────────────────────────────────────────────────────────────────────────────
# Messaging
# ─────────────────────────────────────────────────────────────────────────────
class Conversation(models.Model):
    participants = models.ManyToManyField(
        User, related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Conversation<{self.pk}>"

    @property
    def last_message(self):
        return self.messages.order_by("-created_at").first()


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField(max_length=4000)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["is_read"]),
        ]

    def __str__(self) -> str:
        return f"Message<{self.pk} in Conversation {self.conversation_id}>"


# ─────────────────────────────────────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────────────────────────────────────
class Notification(models.Model):
    class Type(models.TextChoices):
        LIKE = "like", "Like"
        COMMENT = "comment", "Comment"
        EVENT_INVITE = "event_invite", "Event invitation"
        EVENT_REMINDER = "event_reminder", "Event reminder"
        CARPOOL = "carpool", "Carpool response"
        RESOURCE = "resource", "Resource request"
        MESSAGE = "message", "Message"
        NOTICE = "notice", "Community notice"
        SYSTEM = "system", "System"

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="triggered_notifications",
        blank=True,
        null=True,
    )
    notification_type = models.CharField(
        max_length=20, choices=Type.choices, default=Type.SYSTEM
    )
    title = models.CharField(max_length=160)
    body = models.CharField(max_length=400, blank=True)
    link = models.CharField(
        max_length=200, blank=True, help_text="Frontend route to open."
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Notification<{self.notification_type} → {self.recipient}>"


# ─────────────────────────────────────────────────────────────────────────────
# Community notices
# ─────────────────────────────────────────────────────────────────────────────
class CommunityNotice(models.Model):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Category(models.TextChoices):
        WATER = "water", "Water Supply"
        SECURITY = "security", "Security"
        MAINTENANCE = "maintenance", "Maintenance"
        MEETING = "meeting", "Meeting"
        EMERGENCY = "emergency", "Emergency"
        GENERAL = "general", "General"

    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notices"
    )
    title = models.CharField(max_length=180)
    description = models.TextField(max_length=4000)
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.NORMAL
    )
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.GENERAL
    )
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_pinned", "-created_at"]
        indexes = [
            models.Index(fields=["priority", "-created_at"]),
            models.Index(fields=["-is_pinned", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"CommunityNotice<{self.title}>"

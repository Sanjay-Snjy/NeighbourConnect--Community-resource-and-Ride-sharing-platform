"""
DRF serializers for NeighbourHub.

Conventions
-----------
* Compact ``UserMiniSerializer`` is embedded wherever an author/owner is shown.
* Read and write serializers are separated where the input differs materially
  from the output (posts, resources, rides, events, conversations).
* Image fields are validated for type/size via ``validators.validate_image_file``.
* Computed, request-aware fields (``is_liked``, ``is_attending``, ``my_request``)
  read the current user from serializer context.
"""

from __future__ import annotations

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import (
    CarpoolRide,
    Comment,
    CommunityNotice,
    Conversation,
    Event,
    EventBooking,
    Message,
    Notification,
    Poll,
    PollOption,
    Post,
    Profile,
    Resource,
    ResourceRequest,
    RideRequest,
)
from .validators import validate_image_file

User = get_user_model()


# ── Helpers ───────────────────────────────────────────────────────────────────
def abs_url(request, filefield) -> str | None:
    if not filefield:
        return None
    url = filefield.url
    return request.build_absolute_uri(url) if request else url


def validate_optional_image(value):
    if value:
        validate_image_file(value)
    return value


def current_user(context):
    request = context.get("request")
    return getattr(request, "user", None) if request else None


# ── Users & profiles ───────────────────────────────────────────────────────────
class UserMiniSerializer(serializers.ModelSerializer):
    """Compact representation for embedding as author/owner."""

    full_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "avatar"]

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

    def get_avatar(self, obj):
        profile = getattr(obj, "profile", None)
        if profile and profile.avatar:
            return abs_url(self.context.get("request"), profile.avatar)
        return None


class ProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ["bio", "neighborhood", "phone", "avatar", "created_at"]

    def get_avatar(self, obj):
        return abs_url(self.context.get("request"), obj.avatar)


class UserSerializer(serializers.ModelSerializer):
    """Full profile view including activity counts."""

    full_name = serializers.SerializerMethodField()
    profile = ProfileSerializer(read_only=True)
    stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "date_joined",
            "is_staff",
            "profile",
            "stats",
        ]
        read_only_fields = ["email", "date_joined", "is_staff"]

    def get_full_name(self, obj) -> str:
        return obj.get_full_name() or obj.username

    def get_stats(self, obj) -> dict:
        return {
            "posts": obj.posts.count(),
            "resources": obj.resources.count(),
            "events": obj.events.count(),
        }


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    neighborhood = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        full_name = validated_data["full_name"].strip()
        first, _, last = full_name.partition(" ")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=first,
            last_name=last,
        )
        # Profile is created by signal; set neighborhood if provided.
        neighborhood = validated_data.get("neighborhood", "").strip()
        if neighborhood:
            user.profile.neighborhood = neighborhood
            user.profile.save(update_fields=["neighborhood"])
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(help_text="Email or username.")
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        password = attrs["password"]

        username = identifier
        if "@" in identifier:
            match = User.objects.filter(email__iexact=identifier).first()
            if match:
                username = match.username

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError(
                {"detail": "Invalid credentials. Please check and try again."}
            )
        if not user.is_active:
            raise serializers.ValidationError({"detail": "This account is disabled."})
        attrs["user"] = user
        return attrs


class ProfileUpdateSerializer(serializers.Serializer):
    """Update account name + profile in one request (supports avatar upload)."""

    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    bio = serializers.CharField(max_length=280, required=False, allow_blank=True)
    neighborhood = serializers.CharField(max_length=120, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True, validators=[validate_optional_image])

    def update(self, instance, validated_data):
        # ``instance`` is the User.
        if "full_name" in validated_data:
            full_name = validated_data["full_name"].strip()
            first, _, last = full_name.partition(" ")
            instance.first_name = first
            instance.last_name = last
            instance.save(update_fields=["first_name", "last_name"])

        profile = instance.profile
        for field in ("bio", "neighborhood", "phone", "avatar"):
            if field in validated_data:
                setattr(profile, field, validated_data[field])
        profile.save()
        return instance

    def to_representation(self, instance):
        return UserSerializer(instance, context=self.context).data


class AuthUserSerializer(serializers.Serializer):
    """Standard payload returned by auth endpoints: {token, user}."""

    def to_representation(self, instance):
        request = self.context.get("request")
        token, _ = Token.objects.get_or_create(user=instance)
        return {
            "token": token.key,
            "user": UserSerializer(instance, context={"request": request}).data,
        }


# ── Polls ─────────────────────────────────────────────────────────────────────
class PollOptionSerializer(serializers.ModelSerializer):
    vote_count = serializers.IntegerField(read_only=True)
    percent = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "text", "position", "vote_count", "percent"]

    def get_percent(self, obj) -> float:
        total = self.context.get("poll_total")
        if total is None:
            total = obj.poll.total_votes
        return round((obj.vote_count / total) * 100, 1) if total else 0.0


class PollSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    total_votes = serializers.IntegerField(read_only=True)
    is_closed = serializers.BooleanField(read_only=True)
    my_votes = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "id",
            "question",
            "allows_multiple",
            "closes_at",
            "is_closed",
            "total_votes",
            "options",
            "my_votes",
        ]

    def get_options(self, obj):
        ctx = {**self.context, "poll_total": obj.total_votes}
        return PollOptionSerializer(obj.options.all(), many=True, context=ctx).data

    def get_my_votes(self, obj) -> list[int]:
        user = current_user(self.context)
        if not user or not user.is_authenticated:
            return []
        return list(
            obj.votes.filter(user=user).values_list("option_id", flat=True)
        )


class PollCreateSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=255)
    allows_multiple = serializers.BooleanField(default=False)
    closes_at = serializers.DateTimeField(required=False, allow_null=True)
    options = serializers.ListField(
        child=serializers.CharField(max_length=120),
        min_length=2,
        max_length=8,
    )


class PollVoteSerializer(serializers.Serializer):
    options = serializers.ListField(
        child=serializers.IntegerField(), min_length=1, max_length=8
    )


# ── Comments ────────────────────────────────────────────────────────────────
class CommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "content", "created_at"]
        read_only_fields = ["author", "post"]


# ── Posts ─────────────────────────────────────────────────────────────────────
class PostSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    poll = PollSerializer(read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "content",
            "image",
            "created_at",
            "updated_at",
            "like_count",
            "comment_count",
            "is_liked",
            "is_mine",
            "poll",
        ]

    def get_image(self, obj):
        return abs_url(self.context.get("request"), obj.image)

    def get_is_liked(self, obj) -> bool:
        user = current_user(self.context)
        if not user or not user.is_authenticated:
            return False
        return obj.likes.filter(user=user).exists()

    def get_is_mine(self, obj) -> bool:
        user = current_user(self.context)
        return bool(user and obj.author_id == user.id)


class PostCreateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True, validators=[validate_optional_image])
    poll = PollCreateSerializer(required=False)

    class Meta:
        model = Post
        fields = ["id", "content", "image", "poll"]

    def validate(self, attrs):
        if not attrs.get("content") and not attrs.get("image") and not attrs.get("poll"):
            raise serializers.ValidationError(
                "A post needs some text, an image, or a poll."
            )
        return attrs

    def create(self, validated_data):
        poll_data = validated_data.pop("poll", None)
        post = Post.objects.create(author=self.context["request"].user, **validated_data)
        if poll_data:
            options = poll_data.pop("options")
            poll = Poll.objects.create(post=post, **poll_data)
            PollOption.objects.bulk_create(
                [
                    PollOption(poll=poll, text=text, position=index)
                    for index, text in enumerate(options)
                ]
            )
        return post

    def to_representation(self, instance):
        return PostSerializer(instance, context=self.context).data


# ── Resources ──────────────────────────────────────────────────────────────────
class ResourceSerializer(serializers.ModelSerializer):
    owner = UserMiniSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    is_mine = serializers.SerializerMethodField()
    my_request_status = serializers.SerializerMethodField()
    request_count = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id",
            "owner",
            "name",
            "category",
            "category_display",
            "description",
            "image",
            "location",
            "is_available",
            "created_at",
            "updated_at",
            "is_mine",
            "my_request_status",
            "request_count",
        ]

    def get_image(self, obj):
        return abs_url(self.context.get("request"), obj.image)

    def get_is_mine(self, obj) -> bool:
        user = current_user(self.context)
        return bool(user and obj.owner_id == user.id)

    def get_my_request_status(self, obj):
        user = current_user(self.context)
        if not user or not user.is_authenticated:
            return None
        req = obj.requests.filter(requester=user).order_by("-created_at").first()
        return req.status if req else None

    def get_request_count(self, obj) -> int:
        return obj.requests.count()


class ResourceCreateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True, validators=[validate_optional_image])

    class Meta:
        model = Resource
        fields = ["id", "name", "category", "description", "image", "location", "is_available"]

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)

    def to_representation(self, instance):
        return ResourceSerializer(instance, context=self.context).data


class ResourceRequestSerializer(serializers.ModelSerializer):
    requester = UserMiniSerializer(read_only=True)
    resource_name = serializers.CharField(source="resource.name", read_only=True)

    class Meta:
        model = ResourceRequest
        fields = [
            "id",
            "resource",
            "resource_name",
            "requester",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = ["resource", "requester", "status"]


# ── Carpool ──────────────────────────────────────────────────────────────────
class RideRequestSerializer(serializers.ModelSerializer):
    requester = UserMiniSerializer(read_only=True)

    class Meta:
        model = RideRequest
        fields = [
            "id",
            "ride",
            "requester",
            "seats",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = ["ride", "requester", "status"]


class CarpoolRideSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    ride_type_display = serializers.CharField(source="get_ride_type_display", read_only=True)
    seats_taken = serializers.IntegerField(read_only=True)
    seats_available = serializers.IntegerField(read_only=True)
    is_mine = serializers.SerializerMethodField()
    my_request_status = serializers.SerializerMethodField()
    request_count = serializers.SerializerMethodField()

    class Meta:
        model = CarpoolRide
        fields = [
            "id",
            "user",
            "ride_type",
            "ride_type_display",
            "origin",
            "destination",
            "date",
            "time",
            "seats",
            "seats_taken",
            "seats_available",
            "notes",
            "status",
            "created_at",
            "is_mine",
            "my_request_status",
            "request_count",
        ]

    def get_is_mine(self, obj) -> bool:
        user = current_user(self.context)
        return bool(user and obj.user_id == user.id)

    def get_my_request_status(self, obj):
        user = current_user(self.context)
        if not user or not user.is_authenticated:
            return None
        req = obj.ride_requests.filter(requester=user).order_by("-created_at").first()
        return req.status if req else None

    def get_request_count(self, obj) -> int:
        return obj.ride_requests.count()


class CarpoolRideCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarpoolRide
        fields = ["id", "ride_type", "origin", "destination", "date", "time", "seats", "notes"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def to_representation(self, instance):
        return CarpoolRideSerializer(instance, context=self.context).data


class RideRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideRequest
        fields = ["id", "seats", "message"]

    def to_representation(self, instance):
        return RideRequestSerializer(instance, context=self.context).data


# ── Events ──────────────────────────────────────────────────────────────────
class EventSerializer(serializers.ModelSerializer):
    organizer = UserMiniSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    attendee_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    is_attending = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "organizer",
            "title",
            "description",
            "category",
            "category_display",
            "date",
            "start_time",
            "end_time",
            "location",
            "image",
            "max_attendees",
            "is_public",
            "status",
            "attendee_count",
            "is_full",
            "is_attending",
            "is_mine",
            "created_at",
        ]

    def get_image(self, obj):
        return abs_url(self.context.get("request"), obj.image)

    def get_is_attending(self, obj) -> bool:
        user = current_user(self.context)
        if not user or not user.is_authenticated:
            return False
        return obj.bookings.filter(user=user).exists()

    def get_is_mine(self, obj) -> bool:
        user = current_user(self.context)
        return bool(user and obj.organizer_id == user.id)


class EventCreateSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True, validators=[validate_optional_image])

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "category",
            "date",
            "start_time",
            "end_time",
            "location",
            "image",
            "max_attendees",
            "is_public",
        ]

    def validate(self, attrs):
        start = attrs.get("start_time")
        end = attrs.get("end_time")
        if start and end and end <= start:
            raise serializers.ValidationError({"end_time": "End time must be after the start time."})
        return attrs

    def create(self, validated_data):
        validated_data["organizer"] = self.context["request"].user
        return super().create(validated_data)

    def to_representation(self, instance):
        return EventSerializer(instance, context=self.context).data


# ── Messaging ──────────────────────────────────────────────────────────────────
class MessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "content", "is_read", "created_at", "is_mine"]
        read_only_fields = ["conversation", "sender", "is_read"]

    def get_is_mine(self, obj) -> bool:
        user = current_user(self.context)
        return bool(user and obj.sender_id == user.id)


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserMiniSerializer(many=True, read_only=True)
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participants",
            "other_participant",
            "last_message",
            "unread_count",
            "updated_at",
        ]

    def _other(self, obj):
        user = current_user(self.context)
        if not user:
            return None
        return obj.participants.exclude(pk=user.pk).first()

    def get_other_participant(self, obj):
        other = self._other(obj)
        return UserMiniSerializer(other, context=self.context).data if other else None

    def get_last_message(self, obj):
        msg = obj.last_message
        if not msg:
            return None
        return {
            "content": msg.content,
            "created_at": msg.created_at,
            "sender_id": msg.sender_id,
        }

    def get_unread_count(self, obj) -> int:
        user = current_user(self.context)
        if not user:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class ConversationCreateSerializer(serializers.Serializer):
    participant_id = serializers.IntegerField()

    def validate_participant_id(self, value):
        request = self.context["request"]
        if value == request.user.id:
            raise serializers.ValidationError("You can't start a conversation with yourself.")
        if not User.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("That person could not be found.")
        return value


# ── Notifications ────────────────────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    actor = UserMiniSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "actor",
            "notification_type",
            "title",
            "body",
            "link",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields


# ── Community notices ──────────────────────────────────────────────────────────
class CommunityNoticeSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = CommunityNotice
        fields = [
            "id",
            "author",
            "title",
            "description",
            "priority",
            "priority_display",
            "category",
            "category_display",
            "is_pinned",
            "created_at",
            "updated_at",
            "is_mine",
        ]

    def get_is_mine(self, obj) -> bool:
        user = current_user(self.context)
        return bool(user and obj.author_id == user.id)


class CommunityNoticeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityNotice
        fields = ["id", "title", "description", "priority", "category", "is_pinned"]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

    def to_representation(self, instance):
        return CommunityNoticeSerializer(instance, context=self.context).data

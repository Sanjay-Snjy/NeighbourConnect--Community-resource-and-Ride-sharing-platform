"""
API views for NeighbourHub.

Structure
---------
* Auth endpoints are plain ``APIView``s (register / login / logout / me).
* Every domain is a ``ViewSet`` with custom ``@action``s for the verbs that
  don't map to plain CRUD (like, comment, vote, request, join, accept …).
* ``OwnedModelViewSet`` applies :class:`IsOwnerOrReadOnly` only to
  update/delete; other actions just require authentication, and owner-only
  actions assert ownership explicitly.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes as dec_perms
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import (
    CarpoolRide,
    Comment,
    CommunityNotice,
    Conversation,
    Event,
    EventBooking,
    Message,
    Notification,
    Post,
    Resource,
    ResourceRequest,
    RideRequest,
)
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    AuthUserSerializer,
    CarpoolRideCreateSerializer,
    CarpoolRideSerializer,
    CommentSerializer,
    CommunityNoticeCreateSerializer,
    CommunityNoticeSerializer,
    ConversationCreateSerializer,
    ConversationSerializer,
    EventCreateSerializer,
    EventSerializer,
    LoginSerializer,
    MessageSerializer,
    NotificationSerializer,
    PollSerializer,
    PollVoteSerializer,
    PostCreateSerializer,
    PostSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResourceCreateSerializer,
    ResourceRequestSerializer,
    ResourceSerializer,
    RideRequestCreateSerializer,
    RideRequestSerializer,
    UserSerializer,
)

User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────────────────────────────────────
class OwnedModelViewSet(viewsets.ModelViewSet):
    """ModelViewSet where only edits/deletes are ownership-gated."""

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def get_permissions(self):
        if self.action in {"update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return [IsAuthenticated()]


# ─────────────────────────────────────────────────────────────────────────────
# Authentication
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Authentication"])
class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses=UserSerializer)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        data = AuthUserSerializer(user, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Authentication"])
class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses=UserSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        data = AuthUserSerializer(user, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)


@extend_schema(tags=["Authentication"])
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Invalidate the current token.
        if request.auth is not None:
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Authentication"], responses=UserSerializer)
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)


# ─────────────────────────────────────────────────────────────────────────────
# Users & profiles
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Users"])
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["username", "first_name", "last_name", "profile__neighborhood"]
    ordering = ["username"]

    def get_queryset(self):
        return (
            User.objects.filter(is_active=True)
            .select_related("profile")
            .order_by("username")
        )

    def get_serializer_context(self):
        return {"request": self.request}

    @extend_schema(
        methods=["GET"], responses=UserSerializer, description="Current user."
    )
    @extend_schema(
        methods=["PATCH"], request=ProfileUpdateSerializer, responses=UserSerializer
    )
    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        if request.method.lower() == "patch":
            serializer = ProfileUpdateSerializer(
                request.user,
                data=request.data,
                partial=True,
                context={"request": request},
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(UserSerializer(request.user, context={"request": request}).data)


# ─────────────────────────────────────────────────────────────────────────────
# Posts, comments, likes, polls
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Posts"])
class PostViewSet(OwnedModelViewSet):
    owner_field = "author"
    filterset_fields = {"author": ["exact"]}
    search_fields = ["content", "author__username"]

    def get_queryset(self):
        return (
            Post.objects.select_related("author", "author__profile", "poll")
            .prefetch_related("likes", "comments", "poll__options")
            .all()
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return PostCreateSerializer
        return PostSerializer

    @extend_schema(request=None, responses={200: dict})
    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = self.get_object()
        liked = services.toggle_like(post, request.user)
        return Response({"is_liked": liked, "like_count": post.like_count})

    @extend_schema(
        methods=["GET"], responses=CommentSerializer(many=True)
    )
    @extend_schema(methods=["POST"], request=CommentSerializer, responses=CommentSerializer)
    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method.lower() == "post":
            serializer = CommentSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            comment = serializer.save(author=request.user, post=post)
            services.notify_comment(post, request.user, comment)
            return Response(
                CommentSerializer(comment, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        qs = post.comments.select_related("author", "author__profile")
        page = self.paginate_queryset(qs)
        serializer = CommentSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(serializer.data)

    @extend_schema(request=PollVoteSerializer, responses=PollSerializer)
    @action(detail=True, methods=["post"])
    def vote(self, request, pk=None):
        post = self.get_object()
        poll = getattr(post, "poll", None)
        if poll is None:
            return Response(
                {"detail": "This post has no poll."}, status=status.HTTP_400_BAD_REQUEST
            )
        serializer = PollVoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.vote_poll(poll, request.user, serializer.validated_data["options"])
        return Response(PollSerializer(poll, context={"request": request}).data)


@extend_schema(tags=["Comments"])
class CommentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CommentSerializer
    owner_field = "author"
    filterset_fields = {"post": ["exact"]}

    def get_queryset(self):
        return Comment.objects.select_related("author", "author__profile", "post")

    def get_serializer_context(self):
        return {"request": self.request}

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return [IsAuthenticated()]


# ─────────────────────────────────────────────────────────────────────────────
# Resources
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Resources"])
class ResourceViewSet(OwnedModelViewSet):
    owner_field = "owner"
    filterset_fields = {"category": ["exact"], "is_available": ["exact"]}
    search_fields = ["name", "description", "location"]

    def get_queryset(self):
        return Resource.objects.select_related("owner", "owner__profile").prefetch_related(
            "requests"
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return ResourceCreateSerializer
        return ResourceSerializer

    @extend_schema(request=ResourceRequestSerializer, responses=ResourceRequestSerializer)
    @action(detail=True, methods=["post"], url_path="request")
    def make_request(self, request, pk=None):
        resource = self.get_object()
        if resource.owner_id == request.user.id:
            return Response(
                {"detail": "You can't request your own item."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not resource.is_available:
            return Response(
                {"detail": "This item is currently unavailable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        req, created = ResourceRequest.objects.get_or_create(
            resource=resource,
            requester=request.user,
            status=ResourceRequest.Status.PENDING,
            defaults={"message": request.data.get("message", "")},
        )
        if created:
            services.notify_resource_request(req)
        return Response(
            ResourceRequestSerializer(req, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @extend_schema(request=None, responses=ResourceSerializer)
    @action(detail=True, methods=["patch"], url_path="availability")
    def toggle_availability(self, request, pk=None):
        resource = self.get_object()
        if resource.owner_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        resource.is_available = not resource.is_available
        resource.save(update_fields=["is_available", "updated_at"])
        return Response(ResourceSerializer(resource, context={"request": request}).data)

    @extend_schema(responses=ResourceRequestSerializer(many=True))
    @action(detail=True, methods=["get"], url_path="requests")
    def requests(self, request, pk=None):
        resource = self.get_object()
        if resource.owner_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = resource.requests.select_related("requester", "requester__profile")
        return Response(
            ResourceRequestSerializer(qs, many=True, context={"request": request}).data
        )

    @extend_schema(responses=ResourceSerializer(many=True))
    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        qs = self.get_queryset().filter(owner=request.user)
        page = self.paginate_queryset(qs)
        serializer = ResourceSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(serializer.data)


@extend_schema(tags=["Resources"])
class ResourceRequestViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ResourceRequestSerializer

    def get_queryset(self):
        user = self.request.user
        return ResourceRequest.objects.select_related(
            "requester", "requester__profile", "resource", "resource__owner"
        ).filter(Q(requester=user) | Q(resource__owner=user))

    def get_serializer_context(self):
        return {"request": self.request}

    def _respond(self, request, pk, new_status):
        req = self.get_queryset().filter(pk=pk).first()
        if not req:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if req.resource.owner_id != request.user.id:
            return Response(
                {"detail": "Only the owner can respond to this request."},
                status=status.HTTP_403_FORBIDDEN,
            )
        req.status = new_status
        req.save(update_fields=["status", "updated_at"])
        if new_status == ResourceRequest.Status.ACCEPTED:
            req.resource.is_available = False
            req.resource.save(update_fields=["is_available", "updated_at"])
            services.notify(
                recipient=req.requester,
                actor=request.user,
                notification_type=Notification.Type.RESOURCE,
                title=f"Your request for “{req.resource.name}” was accepted",
                link="/app/resources",
            )
        return Response(
            ResourceRequestSerializer(req, context={"request": request}).data
        )

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        return self._respond(request, pk, ResourceRequest.Status.ACCEPTED)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._respond(request, pk, ResourceRequest.Status.REJECTED)


# ─────────────────────────────────────────────────────────────────────────────
# Carpool
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Carpool"])
class CarpoolRideViewSet(OwnedModelViewSet):
    owner_field = "user"
    filterset_fields = {"ride_type": ["exact"], "status": ["exact"], "date": ["exact", "gte"]}
    search_fields = ["origin", "destination", "notes"]

    def get_queryset(self):
        return CarpoolRide.objects.select_related("user", "user__profile").prefetch_related(
            "ride_requests"
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return CarpoolRideCreateSerializer
        return CarpoolRideSerializer

    @extend_schema(request=RideRequestCreateSerializer, responses=RideRequestSerializer)
    @action(detail=True, methods=["post"], url_path="request")
    def make_request(self, request, pk=None):
        ride = self.get_object()
        if ride.user_id == request.user.id:
            return Response(
                {"detail": "You can't request your own ride."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if ride.status != CarpoolRide.Status.ACTIVE:
            return Response(
                {"detail": "This ride is no longer active."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = RideRequestCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        req, created = RideRequest.objects.get_or_create(
            ride=ride,
            requester=request.user,
            defaults=serializer.validated_data,
        )
        if created:
            services.notify_ride_request(req)
        return Response(
            RideRequestSerializer(req, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @extend_schema(responses=RideRequestSerializer(many=True))
    @action(detail=True, methods=["get"], url_path="requests")
    def requests(self, request, pk=None):
        ride = self.get_object()
        if ride.user_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = ride.ride_requests.select_related("requester", "requester__profile")
        return Response(
            RideRequestSerializer(qs, many=True, context={"request": request}).data
        )

    @extend_schema(responses=CarpoolRideSerializer(many=True))
    @action(detail=True, methods=["get"])
    def matches(self, request, pk=None):
        ride = self.get_object()
        matched = services.match_rides(ride)
        return Response(
            CarpoolRideSerializer(matched, many=True, context={"request": request}).data
        )

    @extend_schema(responses=CarpoolRideSerializer(many=True))
    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        qs = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(qs)
        serializer = CarpoolRideSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(serializer.data)


@extend_schema(tags=["Carpool"])
class RideRequestViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = RideRequestSerializer

    def get_queryset(self):
        user = self.request.user
        return RideRequest.objects.select_related(
            "requester", "requester__profile", "ride", "ride__user"
        ).filter(Q(requester=user) | Q(ride__user=user))

    def get_serializer_context(self):
        return {"request": self.request}

    def _respond(self, request, pk, new_status):
        req = self.get_queryset().filter(pk=pk).first()
        if not req:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if req.ride.user_id != request.user.id:
            return Response(
                {"detail": "Only the ride owner can respond."},
                status=status.HTTP_403_FORBIDDEN,
            )
        req.status = new_status
        req.save(update_fields=["status", "updated_at"])
        services.notify_ride_response(req)
        # Auto-flip ride to full when seats are exhausted.
        ride = req.ride
        if ride.seats_available <= 0 and ride.status == CarpoolRide.Status.ACTIVE:
            ride.status = CarpoolRide.Status.FULL
            ride.save(update_fields=["status", "updated_at"])
        return Response(RideRequestSerializer(req, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        return self._respond(request, pk, RideRequest.Status.ACCEPTED)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._respond(request, pk, RideRequest.Status.REJECTED)


# ─────────────────────────────────────────────────────────────────────────────
# Events
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Events"])
class EventViewSet(OwnedModelViewSet):
    owner_field = "organizer"
    filterset_fields = {"category": ["exact"], "status": ["exact"], "is_public": ["exact"]}
    search_fields = ["title", "description", "location"]

    def get_queryset(self):
        return Event.objects.select_related("organizer", "organizer__profile").prefetch_related(
            "bookings"
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return EventCreateSerializer
        return EventSerializer

    @extend_schema(request=None, responses={200: dict})
    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        event = self.get_object()
        if event.is_full and not event.bookings.filter(user=request.user).exists():
            return Response(
                {"detail": "This event is already full."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _, created = EventBooking.objects.get_or_create(event=event, user=request.user)
        if created:
            services.notify_event_join(event, request.user)
        return Response({"is_attending": True, "attendee_count": event.attendee_count})

    @extend_schema(request=None, responses={200: dict})
    @action(detail=True, methods=["post", "delete"])
    def leave(self, request, pk=None):
        event = self.get_object()
        EventBooking.objects.filter(event=event, user=request.user).delete()
        return Response({"is_attending": False, "attendee_count": event.attendee_count})

    @extend_schema(responses=UserSerializer(many=True))
    @action(detail=True, methods=["get"])
    def attendees(self, request, pk=None):
        event = self.get_object()
        users = User.objects.filter(event_bookings__event=event).select_related("profile")
        from .serializers import UserMiniSerializer

        return Response(
            UserMiniSerializer(users, many=True, context={"request": request}).data
        )

    @extend_schema(responses=EventSerializer(many=True))
    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        qs = self.get_queryset().filter(
            Q(organizer=request.user) | Q(bookings__user=request.user)
        ).distinct()
        page = self.paginate_queryset(qs)
        serializer = EventSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# Messaging
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Messages"])
class ConversationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants=self.request.user)
            .prefetch_related("participants", "participants__profile", "messages")
            .distinct()
        )

    def get_serializer_context(self):
        return {"request": self.request}

    @extend_schema(request=ConversationCreateSerializer, responses=ConversationSerializer)
    def create(self, request, *args, **kwargs):
        serializer = ConversationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        other = User.objects.get(pk=serializer.validated_data["participant_id"])
        conversation = services.get_or_create_direct_conversation(request.user, other)
        return Response(
            ConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        methods=["GET"], responses=MessageSerializer(many=True)
    )
    @extend_schema(methods=["POST"], request=MessageSerializer, responses=MessageSerializer)
    @action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        if request.user not in conversation.participants.all():
            return Response(status=status.HTTP_403_FORBIDDEN)

        if request.method.lower() == "post":
            content = (request.data.get("content") or "").strip()
            if not content:
                return Response(
                    {"detail": "Message can't be empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            message = Message.objects.create(
                conversation=conversation, sender=request.user, content=content
            )
            conversation.save(update_fields=["updated_at"])
            services.notify_message(message)
            return Response(
                MessageSerializer(message, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )

        # GET: return messages and mark the other party's messages as read.
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(
            is_read=True
        )
        qs = conversation.messages.select_related("sender", "sender__profile")
        return Response(
            MessageSerializer(qs, many=True, context={"request": request}).data
        )

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(
            is_read=True
        )
        return Response({"status": "ok"})


# ─────────────────────────────────────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Notifications"])
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = {"is_read": ["exact"], "notification_type": ["exact"]}

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related(
            "actor", "actor__profile"
        )

    def get_serializer_context(self):
        return {"request": self.request}

    @extend_schema(responses={200: dict})
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread": count})

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification, context={"request": request}).data)

    @extend_schema(responses={200: dict})
    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"updated": updated})


# ─────────────────────────────────────────────────────────────────────────────
# Community notices
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["Notices"])
class CommunityNoticeViewSet(OwnedModelViewSet):
    owner_field = "author"
    filterset_fields = {"priority": ["exact"], "category": ["exact"]}
    search_fields = ["title", "description"]

    def get_queryset(self):
        return CommunityNotice.objects.select_related("author", "author__profile")

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return CommunityNoticeCreateSerializer
        return CommunityNoticeSerializer

    def perform_create(self, serializer):
        # Only staff may pin notices.
        pin = serializer.validated_data.get("is_pinned", False) and self.request.user.is_staff
        notice = serializer.save(is_pinned=pin)
        services.notify_notice(notice)


# ─────────────────────────────────────────────────────────────────────────────
# Search & dashboard
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(
    tags=["Search"],
    parameters=[OpenApiParameter("q", str, description="Search query.")],
    responses={200: dict},
)
class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        ctx = {"request": request}
        if len(q) < 2:
            return Response(
                {"query": q, "people": [], "posts": [], "resources": [], "events": [], "rides": []}
            )

        from .serializers import UserMiniSerializer

        people = User.objects.filter(is_active=True).filter(
            Q(username__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
        ).select_related("profile")[:6]
        posts = Post.objects.filter(content__icontains=q).select_related(
            "author", "author__profile"
        )[:6]
        resources = Resource.objects.filter(
            Q(name__icontains=q) | Q(description__icontains=q)
        ).select_related("owner", "owner__profile")[:6]
        events = Event.objects.filter(
            Q(title__icontains=q) | Q(location__icontains=q)
        ).select_related("organizer", "organizer__profile")[:6]
        rides = CarpoolRide.objects.filter(
            Q(origin__icontains=q) | Q(destination__icontains=q)
        ).select_related("user", "user__profile")[:6]

        return Response(
            {
                "query": q,
                "people": UserMiniSerializer(people, many=True, context=ctx).data,
                "posts": PostSerializer(posts, many=True, context=ctx).data,
                "resources": ResourceSerializer(resources, many=True, context=ctx).data,
                "events": EventSerializer(events, many=True, context=ctx).data,
                "rides": CarpoolRideSerializer(rides, many=True, context=ctx).data,
            }
        )


@extend_schema(tags=["Users"], responses={200: dict})
@api_view(["GET"])
@dec_perms([IsAuthenticated])
def dashboard_stats(request):
    """Aggregate counts + a small activity slice for the dashboard."""
    today = timezone.localdate()
    ctx = {"request": request}

    upcoming_qs = Event.objects.filter(
        date__gte=today, status=Event.Status.SCHEDULED
    ).select_related("organizer", "organizer__profile")[:5]

    recent_notices = CommunityNotice.objects.select_related(
        "author", "author__profile"
    )[:3]

    stats = {
        "community_members": User.objects.filter(is_active=True).count(),
        "active_requests": ResourceRequest.objects.filter(
            status=ResourceRequest.Status.PENDING
        ).count()
        + RideRequest.objects.filter(status=RideRequest.Status.PENDING).count(),
        "upcoming_events": Event.objects.filter(
            date__gte=today, status=Event.Status.SCHEDULED
        ).count(),
        "available_resources": Resource.objects.filter(is_available=True).count(),
    }
    return Response(
        {
            "stats": stats,
            "upcoming_events": EventSerializer(upcoming_qs, many=True, context=ctx).data,
            "recent_notices": CommunityNoticeSerializer(
                recent_notices, many=True, context=ctx
            ).data,
        }
    )

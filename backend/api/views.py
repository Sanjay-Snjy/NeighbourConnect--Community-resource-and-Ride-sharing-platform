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
    Like,
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
# Health Check
# ─────────────────────────────────────────────────────────────────────────────
@extend_schema(tags=["System"], operation_id="health_check", responses={200: {"type": "object", "properties": {"status": {"type": "string"}, "timestamp": {"type": "string"}}}}
)
@api_view(["GET"])
@permission_classes([AllowAny])
class HealthCheckView(APIView):
    """Health check endpoint for deployment monitoring."""

    def get(self, request):
        from django.utils import timezone

        # Basic health check - check database connectivity
        try:
            # Simple database query to verify connection
            from django.db import connection

            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()

            if result:
                status_data = {
                    "status": "healthy",
                    "timestamp": timezone.now().isoformat(),
                    "database": "connected",
                }
                return Response(status_data, status=status.HTTP_200_OK)
            else:
                status_data = {
                    "status": "unhealthy",
                    "timestamp": timezone.now().isoformat(),
                    "database": "connected_but_no_result",
                }
                return Response(status_data, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            status_data = {
                "status": "unhealthy",
                "timestamp": timezone.now().isoformat(),
                "database": "disconnected",
                "error": str(e),
            }
            return Response(status_data, status=status.HTTP_503_SERVICE_UNAVAILABLE)

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
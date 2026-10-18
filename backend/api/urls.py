"""API URL routing."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("users", views.UserViewSet, basename="user")
router.register("posts", views.PostViewSet, basename="post")
router.register("comments", views.CommentViewSet, basename="comment")
router.register("resources", views.ResourceViewSet, basename="resource")
router.register(
    "resource-requests", views.ResourceRequestViewSet, basename="resource-request"
)
router.register("rides", views.CarpoolRideViewSet, basename="ride")
router.register("ride-requests", views.RideRequestViewSet, basename="ride-request")
router.register("events", views.EventViewSet, basename="event")
router.register("conversations", views.ConversationViewSet, basename="conversation")
router.register("notifications", views.NotificationViewSet, basename="notification")
router.register("notices", views.CommunityNoticeViewSet, basename="notice")

auth_patterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("me/", views.MeView.as_view(), name="auth-me"),
]

# Health check for deployment monitoring
health_patterns = [
    path("healthz/", views.HealthCheckView.as_view(), name="health-check"),
]

urlpatterns = [
    path("auth/", include(auth_patterns)),
    path("healthz/", include(health_patterns)),
    path("search/", views.SearchView.as_view(), name="search"),
    path("stats/dashboard/", views.dashboard_stats, name="dashboard-stats"),
    path("stats/community/", views.community_stats, name="community-stats"),
    path("", include(router.urls)),
]

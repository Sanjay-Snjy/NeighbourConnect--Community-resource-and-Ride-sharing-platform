"""Root URL configuration for NeighbourHub."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path
from django.views.generic import RedirectView

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def healthz(request):
    """Lightweight liveness probe for load balancers / Render health checks."""
    return HttpResponse("ok", content_type="text/plain")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz/", healthz, name="healthz"),
    # API
    path("api/", include("api.urls")),
    # OpenAPI schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    # Convenience: send bare / to the API docs.
    path("", RedirectView.as_view(url="/api/docs/", permanent=False)),
]

# Serve uploaded media locally during development.
if settings.DEBUG and not settings.USE_S3:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

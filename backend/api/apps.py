from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
    verbose_name = "NeighbourHub"

    def ready(self):
        # Register signal handlers (Profile auto-creation, etc.).
        from . import signals  # noqa: F401

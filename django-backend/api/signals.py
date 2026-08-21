"""Signal handlers: keep a Profile and an auth Token for every user."""

from __future__ import annotations

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

from .models import Profile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_related_user_objects(sender, instance, created, **kwargs):
    """Ensure each user has a Profile and an auth token."""
    if created:
        Profile.objects.get_or_create(user=instance)
        Token.objects.get_or_create(user=instance)

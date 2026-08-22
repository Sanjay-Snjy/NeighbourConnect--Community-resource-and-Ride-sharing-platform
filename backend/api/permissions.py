"""Object-level permissions built around content ownership."""

from __future__ import annotations

from rest_framework import permissions

# Attribute names that commonly hold the "owner" of an object.
OWNER_FIELDS = (
    "author",
    "owner",
    "user",
    "organizer",
    "requester",
    "sender",
)


def _owner_of(obj):
    for field in OWNER_FIELDS:
        if hasattr(obj, field):
            return getattr(obj, field)
    return None


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Read for any authenticated user; write/delete only for the owner.

    The owner is resolved from a view-declared ``owner_field`` if present,
    otherwise from the first matching attribute in :data:`OWNER_FIELDS`.
    """

    message = "You can only modify your own content."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner_field = getattr(view, "owner_field", None)
        owner = getattr(obj, owner_field) if owner_field else _owner_of(obj)
        return owner == request.user


class IsOwner(permissions.BasePermission):
    """Full access only for the owner (no read exception)."""

    message = "You do not have access to this item."

    def has_object_permission(self, request, view, obj):
        owner_field = getattr(view, "owner_field", None)
        owner = getattr(obj, owner_field) if owner_field else _owner_of(obj)
        return owner == request.user


class IsSelfOrReadOnly(permissions.BasePermission):
    """For User objects: only the user themselves may edit their account."""

    message = "You can only edit your own profile."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # ``obj`` may be a User or an object with a ``user`` attribute.
        target = getattr(obj, "user", obj)
        return target == request.user


class IsConversationParticipant(permissions.BasePermission):
    """Only participants may view or post in a conversation."""

    message = "You are not a participant in this conversation."

    def has_object_permission(self, request, view, obj):
        conversation = getattr(obj, "conversation", obj)
        return request.user in conversation.participants.all()

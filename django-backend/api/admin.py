"""Django admin configuration for community management."""

from django.contrib import admin

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
    Poll,
    PollOption,
    PollVote,
    Post,
    Profile,
    Resource,
    ResourceRequest,
    RideRequest,
)

admin.site.site_header = "NeighbourHub Administration"
admin.site.site_title = "NeighbourHub Admin"
admin.site.index_title = "Community management"


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "neighborhood", "phone", "created_at")
    search_fields = ("user__username", "user__email", "neighborhood")
    list_filter = ("neighborhood",)
    autocomplete_fields = ("user",)


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0


class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 0


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "short_content", "like_count", "comment_count", "created_at")
    search_fields = ("content", "author__username")
    list_filter = ("created_at",)
    date_hierarchy = "created_at"
    inlines = [CommentInline]
    autocomplete_fields = ("author",)

    @admin.display(description="Content")
    def short_content(self, obj):
        return (obj.content[:60] + "…") if len(obj.content) > 60 else obj.content


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "post", "created_at")
    search_fields = ("content", "author__username")
    list_filter = ("created_at",)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "created_at")
    search_fields = ("user__username",)


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "allows_multiple", "total_votes", "closes_at")
    search_fields = ("question",)
    inlines = [PollOptionInline]


admin.site.register(PollOption)
admin.site.register(PollVote)


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "owner", "is_available", "location", "created_at")
    list_filter = ("category", "is_available", "created_at")
    search_fields = ("name", "description", "owner__username", "location")
    autocomplete_fields = ("owner",)


@admin.register(ResourceRequest)
class ResourceRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "resource", "requester", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("resource__name", "requester__username")


@admin.register(CarpoolRide)
class CarpoolRideAdmin(admin.ModelAdmin):
    list_display = ("id", "ride_type", "origin", "destination", "date", "time", "seats", "status", "user")
    list_filter = ("ride_type", "status", "date")
    search_fields = ("origin", "destination", "user__username")
    date_hierarchy = "date"


@admin.register(RideRequest)
class RideRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "ride", "requester", "seats", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("requester__username",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "date", "start_time", "location", "organizer", "attendee_count", "status")
    list_filter = ("category", "status", "is_public", "date")
    search_fields = ("title", "description", "location", "organizer__username")
    date_hierarchy = "date"
    autocomplete_fields = ("organizer",)


@admin.register(EventBooking)
class EventBookingAdmin(admin.ModelAdmin):
    list_display = ("id", "event", "user", "created_at")
    search_fields = ("event__title", "user__username")


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "participant_list", "updated_at")
    filter_horizontal = ("participants",)

    @admin.display(description="Participants")
    def participant_list(self, obj):
        return ", ".join(u.username for u in obj.participants.all()[:5])


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("content", "sender__username")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "notification_type", "title", "is_read", "created_at")
    list_filter = ("notification_type", "is_read", "created_at")
    search_fields = ("title", "recipient__username")


@admin.register(CommunityNotice)
class CommunityNoticeAdmin(admin.ModelAdmin):
    list_display = ("title", "priority", "category", "is_pinned", "author", "created_at")
    list_filter = ("priority", "category", "is_pinned", "created_at")
    search_fields = ("title", "description", "author__username")

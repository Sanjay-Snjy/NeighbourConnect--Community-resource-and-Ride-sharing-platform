import { useState } from "react";
import {
  MapPin,
  Clock,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  Lock,
  CalendarDays,
} from "lucide-react";
import { eventsService } from "@/services/events.service";
import { parseApiError } from "@/services/api";
import { labelFor, EVENT_CATEGORIES } from "@/utils/constants";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { formatDate, formatTimeRange, pluralize } from "@/utils/format";

const STATUS_BADGE = {
  cancelled: { tone: "danger", label: "Cancelled" },
  completed: { tone: "muted", label: "Ended" },
};

/** A community event with RSVP, attendee count, and organizer controls. */
export function EventCard({ event, onUpdate, onRemove, onEdit, onViewAttendees }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const iconName = EVENT_CATEGORIES.find((c) => c.value === event.category)?.icon;
  const closed = event.status === "cancelled" || event.status === "completed";
  const statusBadge = STATUS_BADGE[event.status];

  async function toggleRsvp() {
    if (busy) return;
    setBusy(true);
    const wasAttending = event.is_attending;
    // optimistic
    onUpdate?.(event.id, {
      is_attending: !wasAttending,
      attendee_count: Math.max(0, event.attendee_count + (wasAttending ? -1 : 1)),
    });
    try {
      const data = wasAttending
        ? await eventsService.leave(event.id)
        : await eventsService.join(event.id);
      onUpdate?.(event.id, {
        is_attending: data.is_attending,
        attendee_count: data.attendee_count,
        is_full: data.is_full ?? event.is_full,
      });
      toast.success(wasAttending ? "You're no longer attending." : "You're going!");
    } catch (err) {
      onUpdate?.(event.id, {
        is_attending: wasAttending,
        attendee_count: event.attendee_count,
      });
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this event?",
      description: `"${event.title}" and all RSVPs will be permanently removed.`,
      confirmText: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await eventsService.remove(event.id);
      onRemove?.(event.id);
      toast.success("Event deleted.");
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-muted">
            <CategoryIcon name={iconName} className="h-10 w-10 text-primary/40" />
          </div>
        )}

        {/* Date chip */}
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-card px-2.5 py-1 text-center shadow-subtle">
          <span className="text-2xs font-semibold uppercase tracking-wide text-primary">
            {formatDate(event.date, "MMM")}
          </span>
          <span className="text-lg font-bold leading-none text-foreground">
            {formatDate(event.date, "d")}
          </span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          {!event.is_public && (
            <Badge tone="muted" className="gap-1">
              <Lock className="h-3 w-3" /> Private
            </Badge>
          )}
          {statusBadge && <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge tone="soft">
            {event.category_display || labelFor(EVENT_CATEGORIES, event.category)}
          </Badge>
          {event.is_mine && (
            <DropdownMenu>
              <DropdownMenuTrigger className="-mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(event)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAttendees?.(event)}>
                  <Users /> Attendees
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:bg-rose-50 focus:text-destructive [&_svg]:text-destructive"
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground">{event.title}</h3>

        <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {formatDate(event.date, "EEE, MMM d")}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0" />
            {formatTimeRange(event.start_time, event.end_time)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <UserAvatar user={event.organizer} className="h-7 w-7" />
          <button
            type="button"
            onClick={() => onViewAttendees?.(event)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-xs font-medium text-foreground">
              {event.is_mine ? "You're hosting" : event.organizer?.full_name}
            </p>
            <p className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground">
              <Users className="h-3 w-3" />
              {event.max_attendees
                ? `${event.attendee_count} / ${event.max_attendees} going`
                : `${pluralize(event.attendee_count, "going", "going")}`}
            </p>
          </button>

          {!event.is_mine &&
            !closed &&
            (event.is_attending ? (
              <Button variant="outline" size="sm" onClick={toggleRsvp} disabled={busy}>
                <Check className="h-4 w-4 text-primary" /> Going
              </Button>
            ) : event.is_full ? (
              <Button variant="outline" size="sm" disabled>
                Full
              </Button>
            ) : (
              <Button size="sm" onClick={toggleRsvp} disabled={busy}>
                RSVP
              </Button>
            ))}
        </div>
      </div>
    </Card>
  );
}

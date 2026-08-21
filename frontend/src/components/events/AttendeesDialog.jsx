import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { eventsService } from "@/services/events.service";
import { parseApiError } from "@/services/api";
import { UserAvatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

/** Lists everyone attending an event, linking to each member's profile. */
export function AttendeesDialog({ event, open, onOpenChange }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!event) return;
    setLoading(true);
    setError(null);
    try {
      const data = await eventsService.attendees(event.id);
      setAttendees(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Who's going</DialogTitle>
          <DialogDescription className="truncate">{event?.title}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={load} />
        ) : attendees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No RSVPs yet"
            description="Be the first to say you're going."
          />
        ) : (
          <ul className="divide-y divide-border">
            {attendees.map((person) => (
              <li key={person.id}>
                <Link
                  to={`/app/members/${person.id}`}
                  onClick={() => onOpenChange(false)}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
                >
                  <UserAvatar user={person} className="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {person.full_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

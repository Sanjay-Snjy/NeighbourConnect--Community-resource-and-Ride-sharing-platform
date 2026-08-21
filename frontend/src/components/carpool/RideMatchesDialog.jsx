import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, Sparkles, MessageCircle, Loader2 } from "lucide-react";
import { carpoolService } from "@/services/carpool.service";
import { messagesService } from "@/services/messages.service";
import { parseApiError } from "@/services/api";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/components/ui/sonner";
import { friendlyDay, formatTime } from "@/utils/format";

/**
 * Suggested matches for a ride — neighbors posting the opposite ride type on a
 * similar route/day. Owners can jump straight into a conversation.
 */
export function RideMatchesDialog({ ride, open, onOpenChange }) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messagingId, setMessagingId] = useState(null);

  const load = useCallback(async () => {
    if (!ride) return;
    setLoading(true);
    setError(null);
    try {
      const data = await carpoolService.matches(ride.id);
      setMatches(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [ride]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function message(match) {
    if (!match.user?.id) return;
    setMessagingId(match.id);
    try {
      const conversation = await messagesService.startConversation(match.user.id);
      onOpenChange(false);
      navigate(`/app/messages/${conversation.id}`);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setMessagingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Suggested matches
          </DialogTitle>
          <DialogDescription>
            Neighbors headed the same way around the same time.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={load} />
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No matches yet"
            description="We'll suggest neighbors here as soon as someone posts a complementary ride."
          />
        ) : (
          <ul className="space-y-3">
            {matches.map((match) => (
              <li
                key={match.id}
                className="rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={match.ride_type === "offer" ? "info" : "soft"}>
                    {match.ride_type === "offer" ? "Offering" : "Looking"}
                  </Badge>
                  <span className="text-2xs text-muted-foreground">
                    {friendlyDay(match.date)} · {formatTime(match.time)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="min-w-0 truncate">{match.origin}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 truncate">{match.destination}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
                  <UserAvatar user={match.user} className="h-7 w-7" />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {match.user?.full_name}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => message(match)}
                    disabled={messagingId === match.id}
                  >
                    {messagingId === match.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    Message
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

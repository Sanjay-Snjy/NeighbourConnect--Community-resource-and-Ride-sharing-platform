import { useCallback, useEffect, useState } from "react";
import { Check, X, Inbox, Loader2, Users } from "lucide-react";
import { carpoolService, rideRequestsService } from "@/services/carpool.service";
import { parseApiError } from "@/services/api";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { RequestStatusBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { timeAgo, pluralize } from "@/utils/format";

/** Owner-facing dialog listing join requests for a ride. */
export function RideRequestsDialog({ ride, open, onOpenChange, onRideUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    if (!ride) return;
    setLoading(true);
    setError(null);
    try {
      const data = await carpoolService.requests(ride.id);
      setRequests(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [ride]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function act(request, action) {
    setActingId(request.id);
    try {
      await rideRequestsService[action](request.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, status: action === "accept" ? "accepted" : "rejected" }
            : r,
        ),
      );
      if (action === "accept") {
        // Refetch the ride so seat counts / status reflect the acceptance.
        try {
          const fresh = await carpoolService.get(ride.id);
          onRideUpdate?.(ride.id, fresh);
        } catch {
          /* non-fatal — list still updates on next load */
        }
        toast.success(`Confirmed ${request.requester?.full_name?.split(" ")[0] || "your neighbor"}.`);
      } else {
        toast.success("Request declined.");
      }
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ride requests</DialogTitle>
          <DialogDescription>
            {ride?.origin} → {ride?.destination}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={load} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No requests yet"
            description="When neighbors ask to join this ride, they'll appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((request) => (
              <li key={request.id} className="flex items-start gap-3 py-3">
                <UserAvatar user={request.requester} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {request.requester?.full_name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {pluralize(request.seats, "seat")}
                    </span>
                    <RequestStatusBadge status={request.status} />
                  </div>
                  {request.message && (
                    <p className="mt-0.5 break-words text-sm text-muted-foreground">
                      {request.message}
                    </p>
                  )}
                  <p className="mt-0.5 text-2xs text-muted-foreground">
                    {timeAgo(request.created_at)}
                  </p>
                </div>
                {request.status === "pending" && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(request, "reject")}
                      disabled={actingId === request.id}
                      aria-label="Decline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => act(request, "accept")}
                      disabled={actingId === request.id}
                    >
                      {actingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Accept
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

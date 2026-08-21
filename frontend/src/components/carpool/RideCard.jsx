import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Inbox,
  Sparkles,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { carpoolService } from "@/services/carpool.service";
import { parseApiError } from "@/services/api";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RideStatusBadge } from "@/components/common/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { friendlyDay, formatTime, timeAgo, pluralize } from "@/utils/format";

/**
 * A carpool ride. Owners manage requests, matches, edits and deletion; other
 * neighbors can ask to join (offers) or offer to help (requests).
 */
export function RideCard({ ride, onUpdate, onRemove, onEdit, onManageRequests, onViewMatches }) {
  const confirm = useConfirm();
  const isOffer = ride.ride_type === "offer";
  const [requestOpen, setRequestOpen] = useState(false);
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const maxSeats = Math.max(1, ride.seats_available || 1);
  const canRequest =
    ride.status === "active" && (!isOffer || ride.seats_available > 0);

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this ride?",
      description: "Neighbors will no longer see it, and pending requests will be removed.",
      confirmText: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await carpoolService.remove(ride.id);
      onRemove?.(ride.id);
      toast.success("Ride removed.");
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  async function submitRequest() {
    setSubmitting(true);
    try {
      await carpoolService.requestSeat(ride.id, { seats, message: message.trim() });
      onUpdate?.(ride.id, {
        my_request_status: "pending",
        request_count: (ride.request_count ?? 0) + 1,
      });
      toast.success(isOffer ? "Seat request sent." : "Offer sent to the rider.");
      setRequestOpen(false);
      setMessage("");
      setSeats(1);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone={isOffer ? "info" : "soft"}>
            {isOffer ? "Offering a ride" : "Looking for a ride"}
          </Badge>
          <RideStatusBadge status={ride.status} />
        </div>
        {ride.is_mine && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(ride)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageRequests?.(ride)}>
                <Inbox /> Requests
                {ride.request_count > 0 && (
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    {ride.request_count}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewMatches?.(ride)}>
                <Sparkles /> See matches
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

      {/* Route */}
      <div className="mt-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="min-w-0 truncate">{ride.origin}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 truncate">{ride.destination}</span>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" /> {friendlyDay(ride.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {formatTime(ride.time)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {isOffer
            ? `${ride.seats_available} of ${ride.seats} seats left`
            : pluralize(ride.seats, "seat")}
        </span>
      </div>

      {ride.notes && (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {ride.notes}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <UserAvatar user={ride.user} className="h-7 w-7" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {ride.is_mine ? "You" : ride.user?.full_name}
          </p>
          <p className="text-2xs text-muted-foreground">{timeAgo(ride.created_at)}</p>
        </div>

        {!ride.is_mine && (
          <RideAction
            status={ride.my_request_status}
            canRequest={canRequest}
            rideStatus={ride.status}
            isOffer={isOffer}
            onRequest={() => {
              setSeats(1);
              setRequestOpen(true);
            }}
          />
        )}
      </div>

      {/* Join / offer dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isOffer ? "Request a seat" : "Offer to help"}
            </DialogTitle>
            <DialogDescription>
              {ride.origin} → {ride.destination} · {friendlyDay(ride.date)} at{" "}
              {formatTime(ride.time)}
            </DialogDescription>
          </DialogHeader>

          {isOffer && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium text-foreground">Seats</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  disabled={seats <= 1}
                  aria-label="Fewer seats"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                  {seats}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
                  disabled={seats >= maxSeats}
                  aria-label="More seats"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder={
              isOffer
                ? "Let them know where you'd hop on…"
                : "Let them know you can drive and when…"
            }
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function RideAction({ status, canRequest, rideStatus, isOffer, onRequest }) {
  if (status === "pending") {
    return <Badge tone="warning">Requested</Badge>;
  }
  if (status === "accepted") {
    return <Badge tone="success">Confirmed</Badge>;
  }
  if (!canRequest) {
    const label =
      rideStatus === "full" ? "Full" : rideStatus === "active" ? "Full" : "Closed";
    return (
      <Button variant="outline" size="sm" disabled>
        {label}
      </Button>
    );
  }
  return (
    <Button size="sm" onClick={onRequest}>
      {isOffer ? "Request seat" : "Offer to help"}
    </Button>
  );
}

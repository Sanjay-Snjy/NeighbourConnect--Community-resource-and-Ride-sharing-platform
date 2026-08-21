import { useState } from "react";
import {
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Inbox,
  EyeOff,
  Eye,
  Loader2,
  Check,
} from "lucide-react";
import { resourcesService } from "@/services/resources.service";
import { parseApiError } from "@/services/api";
import { labelFor, RESOURCE_CATEGORIES, REQUEST_STATUS } from "@/utils/constants";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { timeAgo, pluralize } from "@/utils/format";

/**
 * A resource in the marketplace grid. Owners get a management menu (edit,
 * toggle availability, manage requests, delete); everyone else gets a borrow
 * button whose state reflects their pending/accepted request.
 */
export function ResourceCard({ resource, onUpdate, onRemove, onEdit, onManageRequests }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const iconName = RESOURCE_CATEGORIES.find((c) => c.value === resource.category)?.icon;
  const status = resource.my_request_status;

  async function toggleAvailability() {
    setBusy(true);
    try {
      const updated = await resourcesService.toggleAvailability(resource.id);
      onUpdate?.(resource.id, { is_available: updated.is_available });
      toast.success(updated.is_available ? "Marked available." : "Marked unavailable.");
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete resource?",
      description: `"${resource.name}" and any requests on it will be permanently removed.`,
      confirmText: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await resourcesService.remove(resource.id);
      onRemove?.(resource.id);
      toast.success("Resource removed.");
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  async function submitRequest() {
    setSubmitting(true);
    try {
      await resourcesService.requestItem(resource.id, message.trim());
      onUpdate?.(resource.id, {
        my_request_status: "pending",
        request_count: (resource.request_count ?? 0) + 1,
      });
      toast.success("Request sent to the owner.");
      setRequestOpen(false);
      setMessage("");
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Media */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {resource.image ? (
          <img
            src={resource.image}
            alt={resource.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-muted">
            <CategoryIcon name={iconName} className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone={resource.is_available ? "success" : "muted"}>
            {resource.is_available ? "Available" : "Unavailable"}
          </Badge>
        </div>
        {resource.is_mine && (
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md bg-card/90 p-1.5 text-muted-foreground shadow-subtle backdrop-blur transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(resource)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageRequests?.(resource)}>
                  <Inbox /> Requests
                  {resource.request_count > 0 && (
                    <span className="ml-auto text-xs font-medium text-muted-foreground">
                      {resource.request_count}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleAvailability} disabled={busy}>
                  {resource.is_available ? <EyeOff /> : <Eye />}
                  {resource.is_available ? "Mark unavailable" : "Mark available"}
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
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate font-semibold text-foreground">
            {resource.name}
          </h3>
          <Badge tone="soft" className="shrink-0">
            {resource.category_display || labelFor(RESOURCE_CATEGORIES, resource.category)}
          </Badge>
        </div>

        {resource.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {resource.description}
          </p>
        )}

        {resource.location && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{resource.location}</span>
          </p>
        )}

        {/* Owner + action */}
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <UserAvatar user={resource.owner} className="h-7 w-7" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {resource.is_mine ? "You" : resource.owner?.full_name}
            </p>
            <p className="text-2xs text-muted-foreground">{timeAgo(resource.created_at)}</p>
          </div>

          {resource.is_mine ? (
            resource.request_count > 0 ? (
              <Button variant="outline" size="sm" onClick={() => onManageRequests?.(resource)}>
                {pluralize(resource.request_count, "request")}
              </Button>
            ) : null
          ) : (
            <ResourceAction
              status={status}
              available={resource.is_available}
              onRequest={() => setRequestOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Borrow request dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request "{resource.name}"</DialogTitle>
            <DialogDescription>
              Send {resource.owner?.full_name?.split(" ")[0] || "the owner"} a note about when
              you'd like to borrow it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Hi! Could I borrow this over the weekend?"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** The borrow button / status pill shown to non-owners. */
function ResourceAction({ status, available, onRequest }) {
  if (status === "pending") {
    return (
      <Badge tone={REQUEST_STATUS.pending.tone} className="shrink-0">
        Requested
      </Badge>
    );
  }
  if (status === "accepted") {
    return (
      <Badge tone={REQUEST_STATUS.accepted.tone} className="shrink-0">
        <Check className="mr-1 h-3 w-3" /> Yours to borrow
      </Badge>
    );
  }
  if (!available) {
    return (
      <Button variant="outline" size="sm" disabled>
        Unavailable
      </Button>
    );
  }
  return (
    <Button size="sm" onClick={onRequest}>
      Request
    </Button>
  );
}

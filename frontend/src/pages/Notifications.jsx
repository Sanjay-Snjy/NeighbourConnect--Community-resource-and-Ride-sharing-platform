import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  Heart,
  MessageCircle,
  CalendarDays,
  CalendarClock,
  Car,
  Package,
  MessagesSquare,
  Megaphone,
  CheckCheck,
} from "lucide-react";
import { notificationsService } from "@/services/notifications.service";
import { useNotificationStore } from "@/store/notificationStore";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { parseApiError } from "@/services/api";
import { timeAgo } from "@/utils/format";
import { cn } from "@/lib/utils";

const TYPE_META = {
  like: { icon: Heart, className: "bg-rose-100 text-rose-600" },
  comment: { icon: MessageCircle, className: "bg-blue-100 text-blue-600" },
  event_invite: { icon: CalendarDays, className: "bg-violet-100 text-violet-600" },
  event_reminder: { icon: CalendarClock, className: "bg-violet-100 text-violet-600" },
  carpool: { icon: Car, className: "bg-emerald-100 text-emerald-600" },
  resource: { icon: Package, className: "bg-amber-100 text-amber-600" },
  message: { icon: MessagesSquare, className: "bg-blue-100 text-blue-600" },
  notice: { icon: Megaphone, className: "bg-amber-100 text-amber-600" },
  system: { icon: Bell, className: "bg-slate-100 text-slate-600" },
};

export default function Notifications() {
  useDocumentTitle("Notifications");
  const navigate = useNavigate();
  const storeDecrement = useNotificationStore((s) => s.decrement);
  const storeReset = useNotificationStore((s) => s.reset);
  const storeRefresh = useNotificationStore((s) => s.refresh);

  const fetcher = useCallback((params) => notificationsService.list(params), []);
  const {
    items,
    count,
    loading,
    loadingMore,
    error,
    hasNext,
    refresh,
    loadMore,
    updateItem,
    replaceAll,
  } = usePaginatedList(fetcher);

  const hasUnread = items.some((n) => !n.is_read);

  async function open(notification) {
    if (!notification.is_read) {
      updateItem(notification.id, { is_read: true });
      storeDecrement();
      notificationsService.markRead(notification.id).catch(() => {
        // revert badge on failure; the row stays optimistic but count re-syncs
        storeRefresh();
      });
    }
    const link = notification.link;
    if (link && link.startsWith("/")) navigate(link);
  }

  async function markAll() {
    const previous = items;
    replaceAll(items.map((n) => ({ ...n, is_read: true })));
    storeReset();
    try {
      await notificationsService.markAllRead();
      toast.success("All caught up.");
    } catch (err) {
      replaceAll(previous);
      storeRefresh();
      toast.error(parseApiError(err).message);
    }
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader
        icon={Bell}
        title="Notifications"
        description="Likes, comments, requests and reminders from your neighborhood."
        actions={
          hasUnread ? (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : null
        }
      />

      <div className="mt-6">
        {loading ? (
          <NotificationsSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No notifications yet"
            description="When neighbors interact with you, you'll hear about it here."
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden p-0">
            {items.map((notification) => {
              const meta = TYPE_META[notification.notification_type] || TYPE_META.system;
              const Icon = meta.icon;
              const clickable = Boolean(notification.link);
              return (
                <div
                  key={notification.id}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => open(notification) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            open(notification);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors",
                    clickable && "cursor-pointer hover:bg-accent/50",
                    !notification.is_read && "bg-primary-50/60",
                  )}
                >
                  <div className="relative shrink-0">
                    {notification.actor ? (
                      <UserAvatar user={notification.actor} className="h-10 w-10" />
                    ) : (
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", meta.className)}>
                        <Icon className="h-5 w-5" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card",
                        meta.className,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{notification.title}</span>
                    </p>
                    {notification.body && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-1 text-2xs text-muted-foreground">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                  )}
                </div>
              );
            })}
          </Card>
        )}

        <LoadMore
          hasNext={hasNext}
          loading={loadingMore}
          onLoadMore={loadMore}
          count={items.length}
          total={count}
        />
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <Card className="divide-y divide-border overflow-hidden p-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </Card>
  );
}

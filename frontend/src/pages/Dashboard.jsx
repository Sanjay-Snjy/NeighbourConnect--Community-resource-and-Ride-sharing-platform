import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Handshake,
  Megaphone,
  Package,
  PenSquare,
  Pin,
  Users,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { parseApiError } from "@/services/api";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/utils/format";
import { labelFor, NOTICE_PRIORITIES } from "@/utils/constants";

const STAT_CARDS = [
  { key: "community_members", label: "Neighbors", icon: Users, to: "/app/members" },
  { key: "available_resources", label: "Resources available", icon: Package, to: "/app/resources" },
  { key: "upcoming_events", label: "Upcoming events", icon: CalendarDays, to: "/app/events" },
  { key: "active_requests", label: "Active requests", icon: Handshake, to: "/app/resources" },
];

const QUICK_ACTIONS = [
  { label: "Share an update", icon: PenSquare, to: "/app/feed" },
  { label: "Offer a resource", icon: Package, to: "/app/resources" },
  { label: "Plan an event", icon: CalendarPlus, to: "/app/events" },
  { label: "Post a notice", icon: Megaphone, to: "/app/notices" },
];

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.stats();
      setData(res);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = (user?.full_name || user?.username || "").split(" ")[0];

  return (
    <div className="container-page py-8">
      <PageHeader
        title={`Welcome back${firstName ? `, ${firstName}` : ""} 👋`}
        description="Here's what's happening around your neighborhood today."
      />

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            asChild
            className="h-auto justify-start gap-3 py-3"
          >
            <Link to={action.to}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <action.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      {error ? (
        <ErrorState className="mt-8" error={error} onRetry={load} />
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STAT_CARDS.map((card, i) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Link to={card.to}>
                  <Card className="transition-shadow hover:shadow-elevated">
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <card.icon className="h-5 w-5" />
                      </span>
                      <div>
                        {loading ? (
                          <Skeleton className="h-7 w-12" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">
                            {data?.stats?.[card.key] ?? 0}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Upcoming events */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Upcoming events
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app/events">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <RowSkeletons />
                ) : data?.upcoming_events?.length ? (
                  <ul className="space-y-1">
                    {data.upcoming_events.map((event) => (
                      <li key={event.id}>
                        <Link
                          to="/app/events"
                          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                        >
                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-2xs font-semibold uppercase leading-none">
                              {formatDate(event.date, "EEE")}
                            </span>
                            <span className="text-base font-bold leading-none">
                              {new Date(event.date).getDate()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {event.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatTime(event.start_time)} · {event.location}
                            </p>
                          </div>
                          <Badge tone="soft">{event.attendee_count} going</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    className="border-0 bg-transparent py-8"
                    icon={CalendarDays}
                    title="No upcoming events"
                    description="Be the first to plan something for your neighborhood."
                    action={
                      <Button size="sm" asChild>
                        <Link to="/app/events">Plan an event</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>

            {/* Recent notices */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Community notices
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app/notices">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <RowSkeletons />
                ) : data?.recent_notices?.length ? (
                  <ul className="space-y-1">
                    {data.recent_notices.map((notice) => (
                      <li key={notice.id}>
                        <Link
                          to="/app/notices"
                          className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            {notice.is_pinned ? (
                              <Pin className="h-4 w-4" />
                            ) : (
                              <Megaphone className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {notice.title}
                            </p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {notice.description}
                            </p>
                          </div>
                          <Badge tone={NOTICE_PRIORITIES.find((p) => p.value === notice.priority)?.tone}>
                            {labelFor(NOTICE_PRIORITIES, notice.priority)}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    className="border-0 bg-transparent py-8"
                    icon={Megaphone}
                    title="No notices yet"
                    description="Important announcements will appear here."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function RowSkeletons() {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

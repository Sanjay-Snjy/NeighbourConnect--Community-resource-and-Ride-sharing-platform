import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Plus, Search, CalendarX2 } from "lucide-react";
import { eventsService } from "@/services/events.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDebounce } from "@/hooks/useDebounce";
import { EVENT_CATEGORIES } from "@/utils/constants";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { EventCard } from "@/components/events/EventCard";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { AttendeesDialog } from "@/components/events/AttendeesDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All events" },
  { value: "scheduled", label: "Upcoming" },
  { value: "completed", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

function cleanParams({ category, status, search }) {
  const out = {};
  if (category && category !== "all") out.category = category;
  if (status && status !== "all") out.status = status;
  if (search?.trim()) out.search = search.trim();
  return out;
}

export default function Events() {
  useDocumentTitle("Events");

  const [tab, setTab] = useState("browse");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [attendeesFor, setAttendeesFor] = useState(null);
  const [attendeesOpen, setAttendeesOpen] = useState(false);

  const fetcher = useCallback((params) => {
    const { scope, ...rest } = params;
    return scope === "mine" ? eventsService.mine(rest) : eventsService.list(rest);
  }, []);

  const initialParams = useMemo(
    () => ({ scope: "browse", ...cleanParams({ category, status, search }) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const {
    items,
    count,
    loading,
    loadingMore,
    error,
    hasNext,
    refresh,
    loadMore,
    setParams,
    prepend,
    updateItem,
    removeItem,
  } = usePaginatedList(fetcher, initialParams);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setParams({ scope: tab, ...cleanParams({ category, status, search: debouncedSearch }) });
  }, [tab, category, status, debouncedSearch, setParams]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(event) {
    setEditing(event);
    setFormOpen(true);
  }
  function openAttendees(event) {
    setAttendeesFor(event);
    setAttendeesOpen(true);
  }
  function handleSaved(saved, isEdit) {
    if (isEdit) updateItem(saved.id, saved);
    else prepend(saved);
  }

  const isMineTab = tab === "mine";

  return (
    <div className="container-page py-8">
      <PageHeader
        icon={CalendarDays}
        title="Events"
        description="Discover what's happening nearby and bring neighbors together."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create event
          </Button>
        }
      />

      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="mine">My events</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <EventGridSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={isMineTab ? "You haven't created any events" : "No events found"}
            description={
              isMineTab
                ? "Organize a cleanup, a workshop, or a neighborhood get-together."
                : "Try different filters, or create the first event for your community."
            }
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Create event
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  onEdit={openEdit}
                  onViewAttendees={openAttendees}
                />
              ))}
            </div>
            <LoadMore
              hasNext={hasNext}
              loading={loadingMore}
              onLoadMore={loadMore}
              count={items.length}
              total={count}
            />
          </>
        )}
      </div>

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
        onSaved={handleSaved}
      />
      <AttendeesDialog
        event={attendeesFor}
        open={attendeesOpen}
        onOpenChange={setAttendeesOpen}
      />
    </div>
  );
}

function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

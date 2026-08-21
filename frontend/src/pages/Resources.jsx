import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, Plus, Search, PackageOpen } from "lucide-react";
import { resourcesService } from "@/services/resources.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDebounce } from "@/hooks/useDebounce";
import { RESOURCE_CATEGORIES } from "@/utils/constants";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceFormDialog } from "@/components/resources/ResourceFormDialog";
import { ResourceRequestsDialog } from "@/components/resources/ResourceRequestsDialog";
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

function cleanParams({ category, availability, search }) {
  const out = {};
  if (category && category !== "all") out.category = category;
  if (availability && availability !== "all") out.is_available = availability;
  if (search?.trim()) out.search = search.trim();
  return out;
}

export default function Resources() {
  useDocumentTitle("Resources");

  const [tab, setTab] = useState("browse");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  // Dialog state (parent owns the shared form + requests dialogs)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [requestsFor, setRequestsFor] = useState(null);
  const [requestsOpen, setRequestsOpen] = useState(false);

  const fetcher = useCallback((params) => {
    const { scope, ...rest } = params;
    return scope === "mine"
      ? resourcesService.mine(rest)
      : resourcesService.list(rest);
  }, []);

  const initialParams = useMemo(
    () => ({ scope: "browse", ...cleanParams({ category, availability, search }) }),
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

  // Re-query whenever tab or filters change (skip the mount-time run).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setParams({ scope: tab, ...cleanParams({ category, availability, search: debouncedSearch }) });
  }, [tab, category, availability, debouncedSearch, setParams]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(resource) {
    setEditing(resource);
    setFormOpen(true);
  }

  function openRequests(resource) {
    setRequestsFor(resource);
    setRequestsOpen(true);
  }

  function handleSaved(saved, isEdit) {
    if (isEdit) updateItem(saved.id, saved);
    else prepend(saved);
  }

  const isMineTab = tab === "mine";

  return (
    <div className="container-page py-8">
      <PageHeader
        icon={Boxes}
        title="Resource marketplace"
        description="Borrow and lend tools, books, and gear with people nearby."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Share a resource
          </Button>
        }
      />

      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="mine">My items</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources…"
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
              {RESOURCE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="true">Available</SelectItem>
              <SelectItem value="false">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6">
        {loading ? (
          <ResourceGridSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title={isMineTab ? "You haven't shared anything yet" : "No resources found"}
            description={
              isMineTab
                ? "Share a tool, book, or anything neighbors might find useful."
                : "Try a different category or search — or be the first to share something."
            }
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Share a resource
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  onEdit={openEdit}
                  onManageRequests={openRequests}
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

      <ResourceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={editing}
        onSaved={handleSaved}
      />
      <ResourceRequestsDialog
        resource={requestsFor}
        open={requestsOpen}
        onOpenChange={setRequestsOpen}
        onResourceUpdate={updateItem}
      />
    </div>
  );
}

function ResourceGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

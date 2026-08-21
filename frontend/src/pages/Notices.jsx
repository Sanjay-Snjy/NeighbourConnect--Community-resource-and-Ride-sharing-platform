import { useCallback, useEffect, useRef, useState } from "react";
import { Megaphone, Plus, Search, ScrollText } from "lucide-react";
import { noticesService } from "@/services/notices.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDebounce } from "@/hooks/useDebounce";
import { NOTICE_CATEGORIES, NOTICE_PRIORITIES } from "@/utils/constants";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { NoticeCard } from "@/components/notices/NoticeCard";
import { NoticeFormDialog } from "@/components/notices/NoticeFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function cleanParams({ category, priority, search }) {
  const out = {};
  if (category && category !== "all") out.category = category;
  if (priority && priority !== "all") out.priority = priority;
  if (search?.trim()) out.search = search.trim();
  return out;
}

export default function Notices() {
  useDocumentTitle("Community notices");

  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetcher = useCallback((params) => noticesService.list(params), []);
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
  } = usePaginatedList(fetcher);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setParams(cleanParams({ category, priority, search: debouncedSearch }));
  }, [category, priority, debouncedSearch, setParams]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(notice) {
    setEditing(notice);
    setFormOpen(true);
  }

  function handleSaved(saved, isEdit) {
    if (isEdit) updateItem(saved.id, saved);
    else prepend(saved);
  }

  const isFiltered =
    category !== "all" || priority !== "all" || Boolean(debouncedSearch.trim());

  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader
        icon={Megaphone}
        title="Community notices"
        description="Announcements, alerts and updates that keep the neighborhood in the loop."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Post notice
          </Button>
        }
      />

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {NOTICE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any priority</SelectItem>
              {NOTICE_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <NoticesSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={isFiltered ? "No notices match your filters" : "No notices yet"}
            description={
              isFiltered
                ? "Try clearing a filter or searching for something else."
                : "There are no announcements right now. Post one to keep neighbors informed."
            }
            action={
              !isFiltered ? (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Post notice
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onEdit={openEdit}
                  onRemove={removeItem}
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

      <NoticeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        notice={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}

function NoticesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-l-4 border-l-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-4/5" />
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </Card>
      ))}
    </div>
  );
}

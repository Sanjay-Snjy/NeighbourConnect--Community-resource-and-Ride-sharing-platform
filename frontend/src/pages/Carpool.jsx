import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Car, Plus, Search, Route } from "lucide-react";
import { carpoolService } from "@/services/carpool.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDebounce } from "@/hooks/useDebounce";
import { RIDE_TYPES } from "@/utils/constants";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { RideCard } from "@/components/carpool/RideCard";
import { RideFormDialog } from "@/components/carpool/RideFormDialog";
import { RideRequestsDialog } from "@/components/carpool/RideRequestsDialog";
import { RideMatchesDialog } from "@/components/carpool/RideMatchesDialog";
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

function cleanParams({ rideType, fromDate, search }) {
  const out = {};
  if (rideType && rideType !== "all") out.ride_type = rideType;
  if (fromDate) out.date__gte = fromDate;
  if (search?.trim()) out.search = search.trim();
  return out;
}

export default function Carpool() {
  useDocumentTitle("Carpool");

  const [tab, setTab] = useState("browse");
  const [rideType, setRideType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [requestsFor, setRequestsFor] = useState(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [matchesFor, setMatchesFor] = useState(null);
  const [matchesOpen, setMatchesOpen] = useState(false);

  const fetcher = useCallback((params) => {
    const { scope, ...rest } = params;
    return scope === "mine" ? carpoolService.mine(rest) : carpoolService.list(rest);
  }, []);

  const initialParams = useMemo(
    () => ({ scope: "browse", ...cleanParams({ rideType, fromDate, search }) }),
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
    setParams({ scope: tab, ...cleanParams({ rideType, fromDate, search: debouncedSearch }) });
  }, [tab, rideType, fromDate, debouncedSearch, setParams]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(ride) {
    setEditing(ride);
    setFormOpen(true);
  }
  function openRequests(ride) {
    setRequestsFor(ride);
    setRequestsOpen(true);
  }
  function openMatches(ride) {
    setMatchesFor(ride);
    setMatchesOpen(true);
  }
  function handleSaved(saved, isEdit) {
    if (isEdit) updateItem(saved.id, saved);
    else prepend(saved);
  }

  const isMineTab = tab === "mine";

  return (
    <div className="container-page py-8">
      <PageHeader
        icon={Car}
        title="Carpool"
        description="Share rides with neighbors — offer a spare seat or find a lift."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Post a ride
          </Button>
        }
      />

      <div className="mt-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="mine">My rides</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by place or note…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={rideType} onValueChange={setRideType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rides</SelectItem>
              {RIDE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-[160px]"
            aria-label="From date"
          />
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <RideListSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Route}
            title={isMineTab ? "You haven't posted any rides" : "No rides found"}
            description={
              isMineTab
                ? "Offer a spare seat or post that you're looking for a lift."
                : "Adjust your filters, or post the first ride for your neighborhood."
            }
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Post a ride
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  onEdit={openEdit}
                  onManageRequests={openRequests}
                  onViewMatches={openMatches}
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

      <RideFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ride={editing}
        onSaved={handleSaved}
      />
      <RideRequestsDialog
        ride={requestsFor}
        open={requestsOpen}
        onOpenChange={setRequestsOpen}
        onRideUpdate={updateItem}
      />
      <RideMatchesDialog ride={matchesFor} open={matchesOpen} onOpenChange={setMatchesOpen} />
    </div>
  );
}

function RideListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-5 w-3/4" />
          <div className="mt-3 flex gap-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}

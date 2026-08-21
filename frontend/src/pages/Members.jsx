import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Search, MapPin, UserRoundSearch } from "lucide-react";
import { usersService } from "@/services/users.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { pluralize } from "@/utils/format";

export default function Members() {
  useDocumentTitle("Community members");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const fetcher = useCallback((params) => usersService.list(params), []);
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
  } = usePaginatedList(fetcher);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setParams(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {});
  }, [debouncedSearch, setParams]);

  const isSearching = Boolean(debouncedSearch.trim());

  return (
    <div className="container-page py-8">
      <PageHeader
        icon={Users}
        title="Community members"
        description={
          count
            ? `${pluralize(count, "neighbor")} in your community`
            : "Meet the people in your neighborhood."
        }
      />

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or neighborhood…"
          className="pl-9"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <MembersSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={UserRoundSearch}
            title={isSearching ? "No members found" : "No members yet"}
            description={
              isSearching
                ? "Try a different name or neighborhood."
                : "As people join your community, they'll show up here."
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((member) => (
                <MemberCard key={member.id} member={member} />
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
    </div>
  );
}

function MemberCard({ member }) {
  const neighborhood = member.profile?.neighborhood;
  const stats = member.stats || {};
  return (
    <Link
      to={`/app/members/${member.id}`}
      className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full p-5 transition-shadow group-hover:shadow-elevated">
        <div className="flex items-center gap-3">
          <UserAvatar user={member} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{member.full_name}</p>
            <p className="truncate text-sm text-muted-foreground">@{member.username}</p>
          </div>
        </div>

        {neighborhood && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{neighborhood}</span>
          </p>
        )}

        <div className="mt-4 flex gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{stats.posts ?? 0}</span> posts
          </span>
          <span>
            <span className="font-semibold text-foreground">{stats.resources ?? 0}</span>{" "}
            shared
          </span>
          <span>
            <span className="font-semibold text-foreground">{stats.events ?? 0}</span> events
          </span>
        </div>
      </Card>
    </Link>
  );
}

function MembersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-32" />
          <Skeleton className="mt-4 h-3 w-full" />
        </Card>
      ))}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Search as SearchIcon,
  Loader2,
  X,
  Users,
  MessageSquareText,
  Package,
  CalendarDays,
  Car,
  ArrowRight,
  SearchX,
} from "lucide-react";
import { searchService } from "@/services/search.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, timeAgo, truncate } from "@/utils/format";

const GROUPS = [
  { key: "people", label: "People", icon: Users },
  { key: "posts", label: "Posts", icon: MessageSquareText },
  { key: "resources", label: "Resources", icon: Package },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "rides", label: "Carpool", icon: Car },
];

export default function Search() {
  useDocumentTitle("Search");
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const debounced = useDebounce(query.trim(), 300);
  const controllerRef = useRef(null);

  // Keep the URL's ?q= in sync so searches are shareable / reloadable.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debounced !== current) {
      setSearchParams(debounced ? { q: debounced } : {}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    searchService
      .query(debounced, { signal: controller.signal })
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced]);

  const counts = useMemo(() => {
    const c = {};
    let total = 0;
    for (const g of GROUPS) {
      const n = results?.[g.key]?.length || 0;
      c[g.key] = n;
      total += n;
    }
    c.all = total;
    return c;
  }, [results]);

  const visibleGroups = GROUPS.filter(
    (g) => (tab === "all" || tab === g.key) && counts[g.key] > 0,
  );

  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader
        icon={SearchIcon}
        title="Search"
        description="Find people, posts, resources, events and rides across your community."
      />

      <div className="relative mt-6">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your neighborhood…"
          className="h-12 pl-11 pr-11 text-base"
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results && counts.all > 0 && (
        <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-1 scrollbar-thin">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-max">
              <TabsTrigger value="all">All {counts.all}</TabsTrigger>
              {GROUPS.filter((g) => counts[g.key] > 0).map((g) => (
                <TabsTrigger key={g.key} value={g.key}>
                  {g.label} {counts[g.key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="mt-6">
        {debounced.length < 2 ? (
          <EmptyState
            icon={SearchIcon}
            title="Search your community"
            description="Type at least two characters to find neighbors, posts, shared items, events and rides."
          />
        ) : loading ? (
          <SearchSkeleton />
        ) : counts.all === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`No results for “${debounced}”`}
            description="Try different keywords or check your spelling."
          />
        ) : (
          <div className="space-y-8">
            {visibleGroups.map((group) => (
              <section key={group.key}>
                <div className="mb-3 flex items-center gap-2">
                  <group.icon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
                  <Badge tone="muted">{counts[group.key]}</Badge>
                </div>
                <Card className="divide-y divide-border overflow-hidden p-0">
                  {results[group.key].map((item) => (
                    <ResultRow
                      key={`${group.key}-${item.id}`}
                      group={group.key}
                      item={item}
                    />
                  ))}
                </Card>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RowShell({ onClick, to, children }) {
  const className =
    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:bg-accent/50";
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function ResultRow({ group, item }) {
  if (group === "people") {
    return (
      <RowShell to={`/app/members/${item.id}`}>
        <UserAvatar user={item} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{item.full_name}</p>
          <p className="truncate text-sm text-muted-foreground">@{item.username}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </RowShell>
    );
  }

  if (group === "posts") {
    return (
      <RowShell to="/app/feed">
        <UserAvatar user={item.author} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-foreground">
            {truncate(item.content || "Shared a post", 140)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.author?.full_name} · {timeAgo(item.created_at)}
          </p>
        </div>
      </RowShell>
    );
  }

  if (group === "resources") {
    return (
      <RowShell to="/app/resources">
        <Thumb src={item.image} icon={Package} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{item.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {item.owner?.full_name}
            {item.location ? ` · ${item.location}` : ""}
          </p>
        </div>
        {item.is_available === false && <Badge tone="muted">Unavailable</Badge>}
      </RowShell>
    );
  }

  if (group === "events") {
    return (
      <RowShell to="/app/events">
        <Thumb src={item.image} icon={CalendarDays} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{item.title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {formatDate(item.date, "EEE, MMM d")}
            {item.location ? ` · ${item.location}` : ""}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </RowShell>
    );
  }

  if (group === "rides") {
    return (
      <RowShell to="/app/carpool">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Car className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
            <span className="truncate">{item.origin}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.destination}</span>
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {formatDate(item.date, "EEE, MMM d")}
          </p>
        </div>
      </RowShell>
    );
  }

  return null;
}

function Thumb({ src, icon: Icon }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function SearchSkeleton() {
  return (
    <Card className="divide-y divide-border overflow-hidden p-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Card>
  );
}

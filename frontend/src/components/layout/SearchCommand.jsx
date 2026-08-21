import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import axios from "axios";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Loader2,
  Package,
  Search as SearchIcon,
  Users,
} from "lucide-react";
import { searchService } from "@/services/search.service";
import { useUIStore } from "@/store/uiStore";
import { useDebounce } from "@/hooks/useDebounce";
import { UserAvatar } from "@/components/ui/avatar";

const GROUPS = [
  { key: "people", label: "People", icon: Users, to: (i) => `/app/members/${i.id}` },
  { key: "resources", label: "Resources", icon: Package, to: () => "/app/resources" },
  { key: "events", label: "Events", icon: CalendarDays, to: () => "/app/events" },
  { key: "rides", label: "Carpool", icon: Car, to: () => "/app/carpool" },
];

export function SearchCommand() {
  const open = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query.trim(), 300);
  const controllerRef = useRef(null);

  // Global ⌘K / Ctrl+K shortcut.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  // Reset when closed.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Run search on debounced query.
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

  function go(path) {
    setSearchOpen(false);
    navigate(path);
  }

  const totalResults =
    results &&
    GROUPS.reduce((sum, g) => sum + (results[g.key]?.length || 0), 0) +
      (results.posts?.length || 0);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setSearchOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover shadow-popover focus:outline-none data-[state=open]:animate-fade-up">
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            {loading ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, resources, events, rides…"
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-2 scrollbar-thin">
            {debounced.length < 2 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type at least two characters to search your neighborhood.
              </p>
            )}

            {debounced.length >= 2 && !loading && totalResults === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No matches for “{debounced}”.
              </p>
            )}

            {results && (
              <div className="space-y-3">
                {results.people?.length > 0 && (
                  <Group label="People">
                    {results.people.map((p) => (
                      <button
                        key={`person-${p.id}`}
                        onClick={() => go(`/app/members/${p.id}`)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <UserAvatar user={p} className="h-8 w-8" />
                        <span className="flex-1 truncate font-medium">{p.full_name}</span>
                        <span className="text-xs text-muted-foreground">@{p.username}</span>
                      </button>
                    ))}
                  </Group>
                )}

                {GROUPS.filter((g) => g.key !== "people").map((g) =>
                  results[g.key]?.length > 0 ? (
                    <Group key={g.key} label={g.label}>
                      {results[g.key].map((item) => (
                        <button
                          key={`${g.key}-${item.id}`}
                          onClick={() => go(g.to(item))}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <g.icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 truncate font-medium">
                            {item.name || item.title || `${item.origin} → ${item.destination}`}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </Group>
                  ) : null,
                )}

                {results.posts?.length > 0 && (
                  <Group label="Posts">
                    {results.posts.map((post) => (
                      <button
                        key={`post-${post.id}`}
                        onClick={() => go("/app/feed")}
                        className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <UserAvatar user={post.author} className="h-8 w-8" />
                        <span className="flex-1 line-clamp-2 text-muted-foreground">
                          {post.content}
                        </span>
                      </button>
                    ))}
                  </Group>
                )}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <p className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

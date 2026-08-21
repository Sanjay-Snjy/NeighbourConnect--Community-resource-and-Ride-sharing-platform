import { useCallback, useEffect, useRef, useState } from "react";
import { parseApiError } from "@/services/api";

/**
 * Generic paginated-list controller for the DRF pagination shape:
 *   { count, num_pages, page, page_size, next, previous, results }
 *
 * Returns list state plus helpers for "load more", refresh, filtering and
 * local optimistic mutation (prepend / update / remove / replaceAll).
 *
 * @param {(params: object) => Promise<object>} fetcher
 * @param {object}  [initialParams]
 * @param {object}  [options]
 * @param {boolean} [options.immediate=true]  fetch on mount
 */
export function usePaginatedList(fetcher, initialParams = {}, options = {}) {
  const { immediate = true } = options;

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(immediate);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const paramsRef = useRef(initialParams);
  const reqId = useRef(0);

  const run = useCallback(
    async (targetPage, { append }) => {
      const id = ++reqId.current;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await fetcher({ ...paramsRef.current, page: targetPage });
        if (id !== reqId.current) return; // stale response — ignore
        const results = data.results ?? data ?? [];
        setItems((prev) => (append ? [...prev, ...results] : results));
        setCount(data.count ?? results.length);
        setHasNext(Boolean(data.next));
        setPage(targetPage);
      } catch (err) {
        if (id !== reqId.current) return;
        if (!err?.code || err.code !== "ERR_CANCELED") {
          setError(parseApiError(err));
          if (!append) setItems([]);
        }
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetcher],
  );

  useEffect(() => {
    if (immediate) run(1, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => run(1, { append: false }), [run]);

  const loadMore = useCallback(() => {
    if (!hasNext || loadingMore || loading) return;
    run(page + 1, { append: true });
  }, [hasNext, loadingMore, loading, page, run]);

  /** Replace filters/search params and refetch from page 1. */
  const setParams = useCallback(
    (next) => {
      paramsRef.current =
        typeof next === "function" ? next(paramsRef.current) : next;
      run(1, { append: false });
    },
    [run],
  );

  // Local optimistic mutators
  const prepend = useCallback((item) => {
    setItems((prev) => [item, ...prev]);
    setCount((c) => c + 1);
  }, []);

  const updateItem = useCallback((id, updater) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? typeof updater === "function"
            ? updater(it)
            : { ...it, ...updater }
          : it,
      ),
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setCount((c) => Math.max(0, c - 1));
  }, []);

  const replaceAll = useCallback((next) => setItems(next), []);

  return {
    items,
    count,
    page,
    hasNext,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    setParams,
    getParams: () => paramsRef.current,
    prepend,
    updateItem,
    removeItem,
    replaceAll,
  };
}

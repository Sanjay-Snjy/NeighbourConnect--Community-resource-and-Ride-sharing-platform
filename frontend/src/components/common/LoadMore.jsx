import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** "Load more" footer for paginated lists. */
export function LoadMore({ hasNext, loading, onLoadMore, count, total }) {
  if (!hasNext) {
    return count > 0 ? (
      <p className="py-6 text-center text-xs text-muted-foreground">
        You've reached the end{typeof total === "number" ? ` · ${total} in total` : ""}.
      </p>
    ) : null;
  }
  return (
    <div className="flex justify-center py-6">
      <Button variant="outline" onClick={onLoadMore} disabled={loading}>
        {loading ? <Spinner size={16} /> : null}
        {loading ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}

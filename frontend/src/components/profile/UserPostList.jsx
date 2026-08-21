import { useCallback } from "react";
import { FileText } from "lucide-react";
import { postsService } from "@/services/posts.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { PostCard } from "@/components/feed/PostCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The posts authored by a single user, wired to the same PostCard used in the
 * community feed (likes, comments, poll voting and delete all work here too).
 */
export function UserPostList({ userId, isMe = false }) {
  const fetcher = useCallback(
    (params) => postsService.list({ ...params, author: userId }),
    [userId],
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
    updateItem,
    removeItem,
  } = usePaginatedList(fetcher);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={isMe ? "You haven't posted yet" : "No posts yet"}
        description={
          isMe
            ? "Share an update with your neighborhood from the community feed."
            : "This neighbor hasn't shared anything with the community yet."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={updateItem} onRemove={removeItem} />
      ))}
      <LoadMore
        hasNext={hasNext}
        loading={loadingMore}
        onLoadMore={loadMore}
        count={items.length}
        total={count}
      />
    </div>
  );
}

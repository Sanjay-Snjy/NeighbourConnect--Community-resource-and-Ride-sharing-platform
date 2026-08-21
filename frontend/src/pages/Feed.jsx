import { useCallback } from "react";
import { MessagesSquare } from "lucide-react";
import { postsService } from "@/services/posts.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadMore } from "@/components/common/LoadMore";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Feed() {
  useDocumentTitle("Community feed");
  const fetcher = useCallback((params) => postsService.list(params), []);
  const {
    items,
    count,
    loading,
    loadingMore,
    error,
    hasNext,
    refresh,
    loadMore,
    prepend,
    updateItem,
    removeItem,
  } = usePaginatedList(fetcher);

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader
        title="Community feed"
        description="Share updates, ask questions, and keep up with your neighbors."
      />

      <div className="mt-6">
        <PostComposer onCreated={prepend} />
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <FeedSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No posts yet"
            description="Be the first to share something with your neighborhood — an update, a question, or a quick poll."
          />
        ) : (
          <>
            {items.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}
            <LoadMore
              hasNext={hasNext}
              loading={loadingMore}
              onLoadMore={loadMore}
              count={count}
              total={count}
            />
          </>
        )}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
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
          <Skeleton className="mt-4 h-40 w-full rounded-xl" />
        </Card>
      ))}
    </>
  );
}

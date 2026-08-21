import { useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { postsService } from "@/services/posts.service";
import { parseApiError } from "@/services/api";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { PollBlock } from "@/components/feed/PollBlock";
import { CommentsSection } from "@/components/feed/CommentsSection";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { timeAgo, pluralize } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * A single feed post: author, content, optional image or poll, and an action
 * bar with optimistic likes plus an expandable comments section.
 */
export function PostCard({ post, onUpdate, onRemove }) {
  const confirm = useConfirm();
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);

  async function toggleLike() {
    if (liking) return;
    setLiking(true);
    // optimistic
    const optimistic = {
      is_liked: !post.is_liked,
      like_count: post.like_count + (post.is_liked ? -1 : 1),
    };
    onUpdate?.(post.id, optimistic);
    try {
      const data = await postsService.toggleLike(post.id);
      onUpdate?.(post.id, { is_liked: data.is_liked, like_count: data.like_count });
    } catch (err) {
      // revert
      onUpdate?.(post.id, { is_liked: post.is_liked, like_count: post.like_count });
      toast.error(parseApiError(err).message);
    } finally {
      setLiking(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete post?",
      description: "This post and its comments will be permanently removed.",
      confirmText: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await postsService.remove(post.id);
      onRemove?.(post.id);
      toast.success("Post deleted.");
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <UserAvatar user={post.author} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{post.author?.full_name}</p>
          <p className="text-xs text-muted-foreground">
            @{post.author?.username} · {timeAgo(post.created_at)}
          </p>
        </div>
        {post.is_mine && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:bg-rose-50 focus:text-destructive [&_svg]:text-destructive"
              >
                <Trash2 /> Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {post.content && (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {post.content}
        </p>
      )}

      {post.image && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <img
            src={post.image}
            alt="Post attachment"
            loading="lazy"
            className="max-h-[32rem] w-full object-cover"
          />
        </div>
      )}

      {post.poll && (
        <PollBlock
          poll={post.poll}
          postId={post.id}
          onVoted={(poll) => onUpdate?.(post.id, { poll })}
        />
      )}

      {/* Action bar */}
      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
        <button
          onClick={toggleLike}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            post.is_liked
              ? "text-primary hover:bg-primary-50"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4", post.is_liked && "fill-current")} />
          {post.like_count > 0 ? post.like_count : "Like"}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            showComments
              ? "text-primary hover:bg-primary-50"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <MessageCircle className="h-4 w-4" />
          {post.comment_count > 0 ? post.comment_count : "Comment"}
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {post.comment_count > 0 ? pluralize(post.comment_count, "comment") : ""}
        </span>
      </div>

      {showComments && (
        <CommentsSection
          postId={post.id}
          onCountChange={(delta) =>
            onUpdate?.(post.id, (p) => ({
              ...p,
              comment_count: Math.max(0, p.comment_count + delta),
            }))
          }
        />
      )}
    </Card>
  );
}

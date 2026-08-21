import { useEffect, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { postsService, commentsService } from "@/services/posts.service";
import { parseApiError } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { timeAgo } from "@/utils/format";
import { cn } from "@/lib/utils";

const MAX = 1000;

export function CommentsSection({ postId, onCountChange }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load(targetPage = 1) {
    if (targetPage === 1) setLoading(true);
    setError(null);
    try {
      const data = await postsService.listComments(postId, { page: targetPage });
      setComments((prev) =>
        targetPage === 1 ? data.results : [...prev, ...data.results],
      );
      setHasNext(Boolean(data.next));
      setPage(targetPage);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const content = value.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const comment = await postsService.addComment(postId, content);
      setComments((prev) => [...prev, comment]);
      setValue("");
      onCountChange?.(1);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(comment) {
    const ok = await confirm({
      title: "Delete comment?",
      description: "This comment will be permanently removed.",
      confirmText: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await commentsService.remove(comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      onCountChange?.(-1);
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {/* Composer */}
      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <UserAvatar user={user} className="mt-0.5 h-8 w-8" />
        <div className="flex-1">
          <div className="flex items-end gap-2">
            <textarea
              value={value}
              maxLength={MAX}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
              }}
              rows={1}
              placeholder="Write a comment…"
              className="min-h-[38px] flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-subtle transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" disabled={!value.trim() || submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* List */}
      <div className="mt-3 space-y-3">
        {loading ? (
          <p className="py-2 text-center text-xs text-muted-foreground">Loading comments…</p>
        ) : error ? (
          <button
            onClick={() => load(1)}
            className="w-full py-2 text-center text-xs font-medium text-primary hover:underline"
          >
            Couldn't load comments — tap to retry
          </button>
        ) : comments.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No comments yet. Start the conversation.
          </p>
        ) : (
          comments.map((comment) => {
            const mine = comment.author?.id === user?.id;
            return (
              <div key={comment.id} className="group flex items-start gap-2">
                <UserAvatar user={comment.author} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {comment.author?.full_name}
                      </span>
                      <span className="text-2xs text-muted-foreground">
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
                      {comment.content}
                    </p>
                  </div>
                </div>
                {mine && (
                  <button
                    onClick={() => handleDelete(comment)}
                    className={cn(
                      "mt-1 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-rose-50 hover:text-destructive",
                      "group-hover:opacity-100 focus:opacity-100",
                    )}
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}

        {hasNext && !loading && (
          <button
            onClick={() => load(page + 1)}
            className="w-full py-1 text-center text-xs font-medium text-primary hover:underline"
          >
            Show earlier comments
          </button>
        )}
      </div>
    </div>
  );
}

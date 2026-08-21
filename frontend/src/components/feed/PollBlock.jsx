import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { parseApiError } from "@/services/api";
import { postsService } from "@/services/posts.service";
import { pluralize } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Renders a poll attached to a post. Shows a voting UI until the current user
 * has voted (or the poll is closed), then renders result bars.
 *
 * @param {object} poll     the poll object from the API
 * @param {number} postId   parent post id (vote endpoint lives on the post)
 * @param {(poll) => void} onVoted  called with the updated poll after voting
 */
export function PollBlock({ poll, postId, onVoted }) {
  const alreadyVoted = poll.my_votes?.length > 0;
  const showResults = alreadyVoted || poll.is_closed;
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function toggle(optionId) {
    if (poll.allows_multiple) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelected([optionId]);
    }
  }

  async function submit(optionIds) {
    if (!optionIds.length || submitting) return;
    setSubmitting(true);
    try {
      const updated = await postsService.vote(postId, optionIds);
      onVoted?.(updated);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
      <p className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
        <span>{poll.question}</span>
        {poll.is_closed && (
          <span className="shrink-0 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
            Closed
          </span>
        )}
      </p>

      <div className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const mine = poll.my_votes?.includes(option.id);
          const isSelected = selected.includes(option.id);

          if (showResults) {
            return (
              <div key={option.id} className="relative">
                <div className="relative overflow-hidden rounded-lg border border-border bg-card">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-lg transition-all",
                      mine ? "bg-primary/20" : "bg-muted",
                    )}
                    style={{ width: `${option.percent}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-1.5 text-sm text-foreground">
                      {mine && <Check className="h-3.5 w-3.5 text-primary" />}
                      {option.text}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {option.percent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                poll.allows_multiple ? toggle(option.id) : submit([option.id])
              }
              disabled={submitting}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary-50 text-primary-700"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center border",
                  poll.allows_multiple ? "rounded" : "rounded-full",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              {option.text}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {pluralize(poll.total_votes, "vote")}
          {poll.allows_multiple && !showResults ? " · pick one or more" : ""}
        </p>
        {poll.allows_multiple && !showResults && (
          <Button
            size="sm"
            onClick={() => submit(selected)}
            disabled={!selected.length || submitting}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Vote
          </Button>
        )}
      </div>
    </div>
  );
}

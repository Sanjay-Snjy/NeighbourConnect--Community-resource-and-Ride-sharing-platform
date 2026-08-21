import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Image as ImageIcon, Loader2, Plus, Send, X } from "lucide-react";
import { postsService } from "@/services/posts.service";
import { parseApiError } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const MAX = 2000;
const emptyPoll = { question: "", options: ["", ""], allows_multiple: false };

export function PostComposer({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [poll, setPoll] = useState(null); // null = no poll
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const pollValid =
    poll &&
    poll.question.trim().length >= 3 &&
    poll.options.filter((o) => o.trim()).length >= 2;

  const canSubmit =
    !submitting &&
    (content.trim().length > 0 || image instanceof File || pollValid);

  function reset() {
    setContent("");
    setImage(null);
    setShowImage(false);
    setPoll(null);
    setFocused(false);
  }

  function enableImage() {
    setPoll(null);
    setShowImage(true);
    setFocused(true);
  }

  function enablePoll() {
    setImage(null);
    setShowImage(false);
    setPoll(poll ? null : { ...emptyPoll });
    setFocused(true);
  }

  function setOption(index, value) {
    setPoll((p) => ({
      ...p,
      options: p.options.map((o, i) => (i === index ? value : o)),
    }));
  }

  function addOption() {
    setPoll((p) => (p.options.length >= 8 ? p : { ...p, options: [...p.options, ""] }));
  }

  function removeOption(index) {
    setPoll((p) =>
      p.options.length <= 2
        ? p
        : { ...p, options: p.options.filter((_, i) => i !== index) },
    );
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = { content: content.trim() };
      if (image instanceof File) {
        payload.image = image;
      } else if (pollValid) {
        payload.poll = {
          question: poll.question.trim(),
          options: poll.options.map((o) => o.trim()).filter(Boolean),
          allows_multiple: poll.allows_multiple,
        };
      }
      const created = await postsService.create(payload);
      onCreated?.(created);
      reset();
      toast.success("Posted to your neighborhood.");
    } catch (err) {
      const parsed = parseApiError(err);
      toast.error(parsed.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <UserAvatar user={user} className="h-10 w-10" />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            maxLength={MAX}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={`What's happening in the neighborhood, ${
              (user?.full_name || "").split(" ")[0] || "neighbor"
            }?`}
            rows={focused || content ? 3 : 1}
            className="w-full resize-none rounded-lg border border-transparent bg-transparent px-0 py-1.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground"
          />

          <AnimatePresence>
            {showImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ImageDropzone value={image} onChange={setImage} className="mt-2" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {poll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Create a poll
                    </span>
                    <button
                      onClick={() => setPoll(null)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Remove poll"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    value={poll.question}
                    onChange={(e) => setPoll((p) => ({ ...p, question: e.target.value }))}
                    placeholder="Ask a question…"
                    maxLength={255}
                  />
                  <div className="space-y-2">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => setOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          maxLength={120}
                        />
                        {poll.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
                            aria-label="Remove option"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {poll.options.length < 8 && (
                    <Button variant="ghost" size="sm" onClick={addOption} className="gap-1.5">
                      <Plus className="h-4 w-4" /> Add option
                    </Button>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <Label htmlFor="poll-multi" className="text-sm font-normal text-muted-foreground">
                      Allow multiple choices
                    </Label>
                    <Switch
                      id="poll-multi"
                      checked={poll.allows_multiple}
                      onCheckedChange={(v) => setPoll((p) => ({ ...p, allows_multiple: v }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={enableImage}
                disabled={Boolean(poll)}
                className={cn("gap-1.5", showImage && "text-primary")}
              >
                <ImageIcon className="h-4 w-4" /> Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={enablePoll}
                disabled={showImage}
                className={cn("gap-1.5", poll && "text-primary")}
              >
                <BarChart3 className="h-4 w-4" /> Poll
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {content.length > MAX * 0.8 && (
                <span className="text-2xs text-muted-foreground">
                  {MAX - content.length}
                </span>
              )}
              <Button onClick={submit} disabled={!canSubmit} size="sm">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

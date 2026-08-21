import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { messagesService } from "@/services/messages.service";
import { parseApiError } from "@/services/api";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

const POLL_MS = 7000;
const MAX = 2000;

function dayKey(value) {
  return formatDate(value, "yyyy-MM-dd");
}

function dayLabel(value) {
  return formatDate(value, "EEEE, MMM d");
}

/** The open conversation: header, scrollable message list, and composer. */
export function MessageThread({ conversation, onBack, onMessageSent, onRead }) {
  const conversationId = conversation?.id;
  const person = conversation?.other_participant;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const reqRef = useRef(0);

  const scrollToBottom = useCallback((behavior = "auto") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!conversationId) return;
      const id = ++reqRef.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await messagesService.messages(conversationId);
        if (id !== reqRef.current) return;
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setMessages((prev) => {
          const changed =
            prev.length !== list.length ||
            prev[prev.length - 1]?.id !== list[list.length - 1]?.id;
          if (changed) scrollToBottom(silent ? "smooth" : "auto");
          return list;
        });
        onRead?.(conversationId);
      } catch (err) {
        if (id !== reqRef.current) return;
        if (!silent) setError(parseApiError(err));
      } finally {
        if (id === reqRef.current && !silent) setLoading(false);
      }
    },
    [conversationId, onRead, scrollToBottom],
  );

  // Load on conversation change + poll for new messages.
  useEffect(() => {
    setMessages([]);
    load();
    const timer = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId, load]);

  async function handleSubmit(e) {
    e?.preventDefault();
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const message = await messagesService.send(conversationId, content);
      setMessages((prev) => [...prev, message]);
      setValue("");
      scrollToBottom("smooth");
      onMessageSent?.(conversationId, message);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <UserAvatar user={person} className="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {person?.full_name || "Neighbor"}
          </p>
          {person?.username && (
            <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size={22} />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={load} />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <UserAvatar user={person} className="h-14 w-14" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {person?.full_name}
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              This is the start of your conversation. Say hello!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const prev = messages[index - 1];
              const showDay = !prev || dayKey(prev.created_at) !== dayKey(message.created_at);
              return (
                <Fragment key={message.id}>
                  {showDay && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-muted px-3 py-1 text-2xs font-medium text-muted-foreground">
                        {dayLabel(message.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={message} />
                </Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={value}
            maxLength={MAX}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm shadow-subtle transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" disabled={!value.trim() || sending} className="h-[42px] w-[42px]">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }) {
  const mine = message.is_mine;
  return (
    <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && <UserAvatar user={message.sender} className="h-7 w-7" />}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
          mine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "mt-0.5 text-right text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatDate(message.created_at, "h:mm a")}
        </p>
      </div>
    </div>
  );
}

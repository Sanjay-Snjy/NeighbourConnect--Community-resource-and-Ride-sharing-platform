import { Link } from "react-router-dom";
import { MessagesSquare, Search } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, truncate } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Left rail of the messages view: searchable list of conversations, each
 * showing the other participant, a preview of the last message, and an unread
 * count.
 */
export function ConversationList({
  conversations,
  activeId,
  loading,
  error,
  onRetry,
  search,
  onSearchChange,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState error={error} onRetry={onRetry} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={MessagesSquare}
              title={search ? "No matches" : "No conversations yet"}
              description={
                search
                  ? "Try a different name."
                  : "Start a chat from a neighbor's profile or a carpool match."
              }
            />
          </div>
        ) : (
          <ul className="p-2">
            {conversations.map((conversation) => {
              const person = conversation.other_participant;
              const isActive = String(conversation.id) === String(activeId);
              const unread = conversation.unread_count > 0;
              return (
                <li key={conversation.id}>
                  <Link
                    to={`/app/messages/${conversation.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-2.5 transition-colors",
                      isActive ? "bg-primary-50" : "hover:bg-accent",
                    )}
                  >
                    <UserAvatar user={person} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            unread ? "font-semibold text-foreground" : "font-medium text-foreground",
                          )}
                        >
                          {person?.full_name || "Neighbor"}
                        </span>
                        {conversation.last_message && (
                          <span className="shrink-0 text-2xs text-muted-foreground">
                            {timeAgo(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-xs",
                            unread ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {conversation.last_message
                            ? truncate(conversation.last_message.content, 42)
                            : "No messages yet"}
                        </span>
                        {unread && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-2xs font-semibold text-primary-foreground">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

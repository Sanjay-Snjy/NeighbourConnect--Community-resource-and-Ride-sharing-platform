import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { messagesService } from "@/services/messages.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useDebounce } from "@/hooks/useDebounce";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Messages() {
  useDocumentTitle("Messages");
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [extraConversation, setExtraConversation] = useState(null);

  const fetcher = useCallback((params) => messagesService.conversations(params), []);
  const { items, loading, error, refresh, updateItem, replaceAll } =
    usePaginatedList(fetcher);

  // Resolve the active conversation — from the loaded list, or fetch it
  // directly (e.g. when arriving from a carpool match or profile link).
  const fromList = items.find((c) => String(c.id) === String(conversationId));
  const activeConversation =
    fromList || (String(extraConversation?.id) === String(conversationId) ? extraConversation : null);

  useEffect(() => {
    let cancelled = false;
    if (conversationId && !fromList) {
      messagesService
        .getConversation(conversationId)
        .then((conv) => {
          if (!cancelled) setExtraConversation(conv);
        })
        .catch(() => {
          if (!cancelled) navigate("/app/messages", { replace: true });
        });
    }
    return () => {
      cancelled = true;
    };
  }, [conversationId, fromList, navigate]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const p = c.other_participant;
      return (
        p?.full_name?.toLowerCase().includes(q) ||
        p?.username?.toLowerCase().includes(q)
      );
    });
  }, [items, debouncedSearch]);

  const handleRead = useCallback(
    (id) => updateItem(id, { unread_count: 0 }),
    [updateItem],
  );

  // Move the touched conversation to the top with an updated preview.
  const handleMessageSent = useCallback(
    (id, message) => {
      const current = items.find((c) => String(c.id) === String(id)) || activeConversation;
      if (!current) {
        refresh();
        return;
      }
      const patched = {
        ...current,
        last_message: {
          content: message.content,
          created_at: message.created_at,
          sender_id: message.sender?.id,
        },
        unread_count: 0,
        updated_at: message.created_at,
      };
      replaceAll([patched, ...items.filter((c) => String(c.id) !== String(id))]);
    },
    [items, activeConversation, replaceAll, refresh],
  );

  return (
    <div className="container-page py-6">
      <Card className="h-[calc(100dvh-8.5rem)] min-h-[520px] overflow-hidden p-0">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[340px_1fr]">
          {/* List */}
          <div
            className={cn(
              "min-h-0 border-border lg:border-r",
              conversationId ? "hidden lg:block" : "block",
            )}
          >
            <ConversationList
              conversations={filtered}
              activeId={conversationId}
              loading={loading}
              error={error}
              onRetry={refresh}
              search={search}
              onSearchChange={setSearch}
            />
          </div>

          {/* Thread */}
          <div
            className={cn(
              "min-h-0",
              conversationId ? "block" : "hidden lg:block",
            )}
          >
            {activeConversation ? (
              <MessageThread
                conversation={activeConversation}
                onBack={() => navigate("/app/messages")}
                onRead={handleRead}
                onMessageSent={handleMessageSent}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <MessagesSquare className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  Your messages
                </h3>
                <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                  Select a conversation to read and reply, or start one from a neighbor's profile.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

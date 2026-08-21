import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Pin,
} from "lucide-react";
import { noticesService } from "@/services/notices.service";
import { parseApiError } from "@/services/api";
import { NOTICE_CATEGORIES, NOTICE_PRIORITIES, labelFor } from "@/utils/constants";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { timeAgo } from "@/utils/format";
import { cn } from "@/lib/utils";

const PRIORITY_ACCENT = {
  muted: "border-l-slate-300",
  info: "border-l-primary",
  warning: "border-l-amber-500",
  danger: "border-l-rose-500",
};

/** A community notice with a priority accent, category, and owner controls. */
export function NoticeCard({ notice, onEdit, onRemove }) {
  const confirm = useConfirm();
  const priorityMeta = NOTICE_PRIORITIES.find((p) => p.value === notice.priority);
  const tone = priorityMeta?.tone || "info";
  const iconName = NOTICE_CATEGORIES.find((c) => c.value === notice.category)?.icon;

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete notice?",
      description: `"${notice.title}" will be permanently removed.`,
      confirmText: "Delete",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await noticesService.remove(notice.id);
      onRemove?.(notice.id);
      toast.success("Notice deleted.");
    } catch (err) {
      toast.error(parseApiError(err).message);
    }
  }

  return (
    <Card
      className={cn(
        "border-l-4 p-4 sm:p-5",
        PRIORITY_ACCENT[tone] || PRIORITY_ACCENT.info,
        notice.is_pinned && "bg-primary-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CategoryIcon name={iconName} className="h-4 w-4" />
            {notice.category_display || labelFor(NOTICE_CATEGORIES, notice.category)}
          </span>
          <Badge tone={tone}>{notice.priority_display || priorityMeta?.label}</Badge>
          {notice.is_pinned && (
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <Pin className="h-3.5 w-3.5 fill-current" /> Pinned
            </span>
          )}
        </div>

        {notice.is_mine && (
          <DropdownMenu>
            <DropdownMenuTrigger className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(notice)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:bg-rose-50 focus:text-destructive [&_svg]:text-destructive"
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <h3 className="mt-2.5 text-base font-semibold text-foreground">{notice.title}</h3>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
        {notice.description}
      </p>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <UserAvatar user={notice.author} className="h-7 w-7" />
        <span className="text-xs font-medium text-foreground">
          {notice.is_mine ? "You" : notice.author?.full_name}
        </span>
        <span className="text-2xs text-muted-foreground">· {timeAgo(notice.created_at)}</span>
      </div>
    </Card>
  );
}

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pin } from "lucide-react";
import { noticeSchema } from "@/schemas/notice.schema";
import { noticesService } from "@/services/notices.service";
import { parseApiError } from "@/services/api";
import { NOTICE_CATEGORIES, NOTICE_PRIORITIES } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";
import { applyFieldErrors } from "@/lib/formErrors";
import { FormField } from "@/components/common/FormField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

/** Create or edit a community notice. Pinning is available to staff only. */
export function NoticeFormDialog({ open, onOpenChange, notice, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(notice);
  const canPin = Boolean(user?.is_staff);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "general",
      priority: "normal",
      is_pinned: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: notice?.title ?? "",
        description: notice?.description ?? "",
        category: notice?.category ?? "general",
        priority: notice?.priority ?? "normal",
        is_pinned: notice?.is_pinned ?? false,
      });
    }
  }, [open, notice, reset]);

  async function onSubmit(values) {
    try {
      const payload = { ...values };
      if (!canPin) delete payload.is_pinned;
      const saved = isEdit
        ? await noticesService.update(notice.id, payload)
        : await noticesService.create(payload);
      toast.success(isEdit ? "Notice updated." : "Notice posted.");
      onSaved?.(saved, isEdit);
      onOpenChange(false);
    } catch (err) {
      const parsed = parseApiError(err);
      if (!applyFieldErrors(parsed, setError)) toast.error(parsed.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit notice" : "Post a notice"}</DialogTitle>
          <DialogDescription>
            Share an announcement with everyone in your neighborhood.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input
              id="title"
              placeholder="e.g. Water supply maintenance on Sunday"
              {...register("title")}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Category" required error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTICE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Priority" required error={errors.priority?.message}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTICE_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField
            label="Details"
            htmlFor="description"
            required
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              rows={5}
              placeholder="Share the full details neighbors should know…"
              {...register("description")}
            />
          </FormField>

          {canPin && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <Pin className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <Label htmlFor="is_pinned">Pin to top</Label>
                  <p className="text-xs text-muted-foreground">
                    Pinned notices stay at the top for everyone.
                  </p>
                </div>
              </div>
              <Controller
                control={control}
                name="is_pinned"
                render={({ field }) => (
                  <Switch
                    id="is_pinned"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Post notice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

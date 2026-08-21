import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { eventSchema } from "@/schemas/event.schema";
import { eventsService } from "@/services/events.service";
import { parseApiError } from "@/services/api";
import { EVENT_CATEGORIES } from "@/utils/constants";
import { applyFieldErrors } from "@/lib/formErrors";
import { FormField } from "@/components/common/FormField";
import { ImageDropzone } from "@/components/common/ImageDropzone";
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

const today = () => new Date().toISOString().slice(0, 10);
const toTimeInput = (t) => (t ? String(t).slice(0, 5) : "");

/** Create or edit a community event. Pass `event` to edit. */
export function EventFormDialog({ open, onOpenChange, event, onSaved }) {
  const isEdit = Boolean(event);
  const [image, setImage] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "meeting",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      max_attendees: "",
      is_public: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: event?.title ?? "",
        description: event?.description ?? "",
        category: event?.category ?? "meeting",
        date: event?.date ?? "",
        start_time: toTimeInput(event?.start_time),
        end_time: toTimeInput(event?.end_time),
        location: event?.location ?? "",
        max_attendees: event?.max_attendees ?? "",
        is_public: event?.is_public ?? true,
      });
      setImage(event?.image ?? null);
    }
  }, [open, event, reset]);

  async function onSubmit(values) {
    try {
      const payload = {
        ...values,
        end_time: values.end_time || null,
        max_attendees: values.max_attendees === "" ? null : values.max_attendees,
      };
      if (image instanceof File) payload.image = image;
      const saved = isEdit
        ? await eventsService.update(event.id, payload)
        : await eventsService.create(payload);
      toast.success(isEdit ? "Event updated." : "Event created — neighbors can RSVP now.");
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
          <DialogTitle>{isEdit ? "Edit event" : "Create an event"}</DialogTitle>
          <DialogDescription>
            Bring neighbors together — a cleanup, a workshop, a get-together.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" placeholder="e.g. Saturday park cleanup" {...register("title")} />
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
                      {EVENT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              label="Location"
              htmlFor="location"
              required
              error={errors.location?.message}
            >
              <Input id="location" placeholder="e.g. Community hall" {...register("location")} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Date" htmlFor="date" required error={errors.date?.message}>
              <Input id="date" type="date" min={today()} {...register("date")} />
            </FormField>
            <FormField
              label="Start"
              htmlFor="start_time"
              required
              error={errors.start_time?.message}
            >
              <Input id="start_time" type="time" {...register("start_time")} />
            </FormField>
            <FormField label="End" htmlFor="end_time" error={errors.end_time?.message}>
              <Input id="end_time" type="time" {...register("end_time")} />
            </FormField>
          </div>

          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              rows={3}
              placeholder="What should attendees know?"
              {...register("description")}
            />
          </FormField>

          <FormField
            label="Attendee limit"
            htmlFor="max_attendees"
            hint="Leave blank for no limit"
            error={errors.max_attendees?.message}
          >
            <Input
              id="max_attendees"
              type="number"
              min={1}
              placeholder="No limit"
              {...register("max_attendees")}
            />
          </FormField>

          <FormField label="Cover photo">
            <ImageDropzone value={image} onChange={setImage} label="Add a cover photo" />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="is_public">Public event</Label>
              <p className="text-xs text-muted-foreground">
                Public events appear in the community events list.
              </p>
            </div>
            <Controller
              control={control}
              name="is_public"
              render={({ field }) => (
                <Switch id="is_public" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

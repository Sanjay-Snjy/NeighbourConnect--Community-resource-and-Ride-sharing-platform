import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { resourceSchema } from "@/schemas/resource.schema";
import { resourcesService } from "@/services/resources.service";
import { parseApiError } from "@/services/api";
import { RESOURCE_CATEGORIES } from "@/utils/constants";
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
import { applyFieldErrors } from "@/lib/formErrors";

/** Create or edit a shared resource. Pass `resource` to edit. */
export function ResourceFormDialog({ open, onOpenChange, resource, onSaved }) {
  const isEdit = Boolean(resource);
  const [image, setImage] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: "",
      category: "other",
      description: "",
      location: "",
      is_available: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: resource?.name ?? "",
        category: resource?.category ?? "other",
        description: resource?.description ?? "",
        location: resource?.location ?? "",
        is_available: resource?.is_available ?? true,
      });
      setImage(resource?.image ?? null);
    }
  }, [open, resource, reset]);

  async function onSubmit(values) {
    try {
      const payload = { ...values };
      if (image instanceof File) payload.image = image;
      const saved = isEdit
        ? await resourcesService.update(resource.id, payload)
        : await resourcesService.create(payload);
      toast.success(isEdit ? "Resource updated." : "Resource shared with your neighborhood.");
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
          <DialogTitle>{isEdit ? "Edit resource" : "Share a resource"}</DialogTitle>
          <DialogDescription>
            Lend something to your neighbors — a tool, a book, or anything useful.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="e.g. Cordless drill" {...register("name")} />
          </FormField>

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
                    {RESOURCE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea
              id="description"
              rows={3}
              placeholder="Any details neighbors should know?"
              {...register("description")}
            />
          </FormField>

          <FormField label="Pickup location" htmlFor="location" error={errors.location?.message}>
            <Input id="location" placeholder="e.g. Building B lobby" {...register("location")} />
          </FormField>

          <FormField label="Photo">
            <ImageDropzone value={image} onChange={setImage} label="Add a photo of the item" />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="is_available">Available now</Label>
              <p className="text-xs text-muted-foreground">
                Turn off to temporarily hide it from neighbors.
              </p>
            </div>
            <Controller
              control={control}
              name="is_available"
              render={({ field }) => (
                <Switch
                  id="is_available"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Share resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

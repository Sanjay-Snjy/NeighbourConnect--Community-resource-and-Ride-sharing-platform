import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight } from "lucide-react";
import { rideSchema } from "@/schemas/carpool.schema";
import { carpoolService } from "@/services/carpool.service";
import { parseApiError } from "@/services/api";
import { RIDE_TYPES } from "@/utils/constants";
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

/** Create or edit a carpool ride. Pass `ride` to edit. */
export function RideFormDialog({ open, onOpenChange, ride, onSaved }) {
  const isEdit = Boolean(ride);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      ride_type: "offer",
      origin: "",
      destination: "",
      date: "",
      time: "",
      seats: 1,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        ride_type: ride?.ride_type ?? "offer",
        origin: ride?.origin ?? "",
        destination: ride?.destination ?? "",
        date: ride?.date ?? "",
        time: toTimeInput(ride?.time),
        seats: ride?.seats ?? 1,
        notes: ride?.notes ?? "",
      });
    }
  }, [open, ride, reset]);

  async function onSubmit(values) {
    try {
      const saved = isEdit
        ? await carpoolService.update(ride.id, values)
        : await carpoolService.create(values);
      toast.success(isEdit ? "Ride updated." : "Ride posted to your neighborhood.");
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
          <DialogTitle>{isEdit ? "Edit ride" : "Post a ride"}</DialogTitle>
          <DialogDescription>
            Offer spare seats or find a lift with neighbors headed the same way.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="I'm…" required error={errors.ride_type?.message}>
            <Controller
              control={control}
              name="ride_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RIDE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="From" htmlFor="origin" required error={errors.origin?.message}>
              <Input id="origin" placeholder="e.g. Maple Street" {...register("origin")} />
            </FormField>
            <FormField
              label="To"
              htmlFor="destination"
              required
              error={errors.destination?.message}
            >
              <Input
                id="destination"
                placeholder="e.g. Downtown station"
                {...register("destination")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Date" htmlFor="date" required error={errors.date?.message}>
              <Input id="date" type="date" min={today()} {...register("date")} />
            </FormField>
            <FormField label="Time" htmlFor="time" required error={errors.time?.message}>
              <Input id="time" type="time" {...register("time")} />
            </FormField>
            <FormField label="Seats" htmlFor="seats" required error={errors.seats?.message}>
              <Input id="seats" type="number" min={1} max={8} {...register("seats")} />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Anything riders should know — luggage space, stops, etc."
              {...register("notes")}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isEdit ? "Save changes" : "Post ride"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { z } from "zod";
import { EVENT_CATEGORIES } from "@/utils/constants";

const categoryValues = EVENT_CATEGORIES.map((c) => c.value);

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Give your event a title").max(160),
    description: z
      .string()
      .trim()
      .max(2000, "Keep the description under 2000 characters")
      .optional()
      .or(z.literal("")),
    category: z.enum(categoryValues, { message: "Pick a category" }),
    date: z.string().min(1, "Choose a date"),
    start_time: z.string().min(1, "Add a start time"),
    end_time: z.string().optional().or(z.literal("")),
    location: z.string().trim().min(2, "Where is it happening?").max(200),
    max_attendees: z
      .union([z.coerce.number().int().min(1).max(100000), z.literal("")])
      .optional(),
    is_public: z.boolean().default(true),
  })
  .refine(
    (data) => !data.end_time || !data.start_time || data.end_time > data.start_time,
    { message: "End time must be after the start time", path: ["end_time"] },
  );

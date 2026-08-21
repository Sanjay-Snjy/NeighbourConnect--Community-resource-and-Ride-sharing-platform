import { z } from "zod";
import { RESOURCE_CATEGORIES } from "@/utils/constants";

const categoryValues = RESOURCE_CATEGORIES.map((c) => c.value);

export const resourceSchema = z.object({
  name: z.string().trim().min(2, "Give your item a name").max(120),
  category: z.enum(categoryValues, { message: "Pick a category" }),
  description: z
    .string()
    .trim()
    .max(1000, "Keep the description under 1000 characters")
    .optional()
    .or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  is_available: z.boolean().default(true),
});

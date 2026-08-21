import { z } from "zod";
import { NOTICE_CATEGORIES, NOTICE_PRIORITIES } from "@/utils/constants";

const categoryValues = NOTICE_CATEGORIES.map((c) => c.value);
const priorityValues = NOTICE_PRIORITIES.map((p) => p.value);

export const noticeSchema = z.object({
  title: z.string().trim().min(3, "Give the notice a title").max(160),
  description: z
    .string()
    .trim()
    .min(5, "Add a few details")
    .max(2000, "Keep it under 2000 characters"),
  category: z.enum(categoryValues, { message: "Pick a category" }),
  priority: z.enum(priorityValues).default("normal"),
  is_pinned: z.boolean().default(false),
});

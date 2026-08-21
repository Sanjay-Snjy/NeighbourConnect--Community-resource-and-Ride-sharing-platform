import { z } from "zod";

export const pollSchema = z.object({
  question: z.string().trim().min(3, "Ask a question").max(255),
  options: z
    .array(z.string().trim().min(1, "Option can't be empty").max(120))
    .min(2, "Add at least two options")
    .max(8, "Up to eight options"),
  allows_multiple: z.boolean().default(false),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Write a comment").max(1000),
});

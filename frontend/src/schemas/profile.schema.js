import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Tell us your name").max(150),
  bio: z
    .string()
    .trim()
    .max(280, "Bios are limited to 280 characters")
    .optional()
    .or(z.literal("")),
  neighborhood: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
});

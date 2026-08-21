import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Tell us your name")
      .max(150, "That name is a little too long"),
    username: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(150)
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Letters, numbers, dots, hyphens and underscores only",
      ),
    email: z.string().trim().email("Enter a valid email address"),
    neighborhood: z.string().trim().max(120).optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(128, "That password is too long"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

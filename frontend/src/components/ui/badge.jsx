import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        soft: "border-transparent bg-primary-50 text-primary-700",
        // Semantic tones
        success: "border-transparent bg-emerald-50 text-emerald-700",
        warning: "border-transparent bg-amber-50 text-amber-700",
        danger: "border-transparent bg-rose-50 text-rose-700",
        info: "border-transparent bg-blue-50 text-blue-700",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** Map a semantic tone string (from constants) to a badge variant. */
export function Badge({ className, variant, tone, ...props }) {
  const resolved = tone ?? variant;
  return (
    <span className={cn(badgeVariants({ variant: resolved }), className)} {...props} />
  );
}

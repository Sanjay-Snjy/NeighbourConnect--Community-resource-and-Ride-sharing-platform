import { cn } from "@/lib/utils";

/** Shimmering placeholder block. Compose several to build loading states. */
export function Skeleton({ className, ...props }) {
  return <div className={cn("skeleton", className)} {...props} />;
}

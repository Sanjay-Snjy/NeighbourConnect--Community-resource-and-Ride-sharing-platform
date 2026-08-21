import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, size = 20 }) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

/** Full-area centered spinner for route-level suspense/loading. */
export function FullPageSpinner({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

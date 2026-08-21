import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Friendly error surface. Never shows raw backend errors — `error` is the
 * normalized { message, status } from parseApiError.
 */
export function ErrorState({ error, onRetry, className, title }) {
  const isOffline = error?.status === 0;
  const Icon = isOffline ? WifiOff : AlertTriangle;
  const heading =
    title || (isOffline ? "Can't reach the server" : "Something went wrong");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{heading}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
        {error?.message || "Please try again in a moment."}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

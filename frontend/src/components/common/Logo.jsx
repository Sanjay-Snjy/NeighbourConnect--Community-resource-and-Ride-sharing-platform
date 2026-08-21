import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** NeighbourHub logo mark — a stylized house/hub in the brand blue. */
export function LogoMark({ className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" aria-hidden="true">
        <path
          d="M9 21.5V13l7-4.5 7 4.5v8.5a1 1 0 0 1-1 1h-3.5v-5.5h-5V22.5H10a1 1 0 0 1-1-1Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

/**
 * Full logo: mark + wordmark. `to` makes it a link (defaults to home).
 */
export function Logo({ className, showText = true, to = "/", size = "md" }) {
  const markSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markSize} />
      {showText && (
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Neighbour<span className="text-primary">Hub</span>
        </span>
      )}
    </span>
  );

  if (to === null) return content;
  return (
    <Link to={to} className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  );
}

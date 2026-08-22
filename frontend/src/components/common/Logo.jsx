import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** NeighbourConnect logo mark — a stylized house/hub in the brand blue. */
export function LogoMark({ className }) {
  return (
     <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-transparent text-primary-foreground",
        className,
      )}
    >
     <img
    src="/assets/logo.png"
    alt="NeighbourConnect"
    className="h-full w-full object-contain"
  />
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
        <span className="font-display text-lg font-extrabold tracking-tight text-slate-300 ">
          Neighbour<span className="text-primary">Connect</span>
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

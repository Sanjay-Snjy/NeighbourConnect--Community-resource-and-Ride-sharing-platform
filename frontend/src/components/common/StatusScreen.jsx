import { Logo } from "@/components/common/Logo";
import { cn } from "@/lib/utils";

/**
 * Centered full-viewport status layout shared by the 404 and error screens.
 * Presentational only — callers supply the copy and action buttons.
 */
export function StatusScreen({ code, icon: Icon, title, description, children, className }) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center",
        className,
      )}
    >
      <Logo to="/" size="lg" />

      <div className="mt-10 flex flex-col items-center">
        {code ? (
          <p className="font-display text-7xl font-extrabold tracking-tight text-primary sm:text-8xl">
            {code}
          </p>
        ) : Icon ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Icon className="h-8 w-8" />
          </div>
        ) : null}

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">{description}</p>
        )}

        {children && (
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">{children}</div>
        )}
      </div>
    </div>
  );
}

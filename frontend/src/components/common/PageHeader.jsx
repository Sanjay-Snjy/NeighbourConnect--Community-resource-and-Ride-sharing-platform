import { cn } from "@/lib/utils";

/**
 * Standard page header: title, optional description, and right-aligned actions.
 * Used at the top of every app page for a consistent rhythm.
 */
export function PageHeader({ title, description, actions, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 sm:flex">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

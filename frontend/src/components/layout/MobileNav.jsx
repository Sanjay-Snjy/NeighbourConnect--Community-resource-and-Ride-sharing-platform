import { NavLink } from "react-router-dom";
import { MOBILE_NAV_ITEMS } from "./navItems";
import { cn } from "@/lib/utils";

/** Fixed bottom navigation for small screens. */
export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-2xs font-medium transition-colors",
                isActive ? "text-primary-600" : "text-muted-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-5 w-5", isActive && "text-primary-600")} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* Safe-area padding for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import { Logo, LogoMark } from "@/components/common/Logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

function NavItem({ item, collapsed }) {
  const { to, label, icon: Icon, end } = item;
  const link = (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-primary-50 text-primary-700"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isActive ? "text-primary-600" : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Desktop sidebar (hidden below lg). Collapses to an icon rail. */
export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? (
          <NavLink to="/" end aria-label="NeighbourHub home">
            <LogoMark className="h-9 w-9" />
          </NavLink>
        ) : (
          <Logo to="/" />
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

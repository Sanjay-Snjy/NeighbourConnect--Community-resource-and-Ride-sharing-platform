import { useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LogOut, Settings, User, X } from "lucide-react";
import { NAV_ITEMS } from "./navItems";
import { Logo } from "@/components/common/Logo";
import { UserAvatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

/** Left slide-out navigation drawer for mobile. */
export function MobileDrawer() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close on route change.
  useEffect(() => {
    setMobileNav(false);
  }, [location.pathname, setMobileNav]);

  async function handleLogout() {
    setMobileNav(false);
    await logout();
    toast.success("Signed out. See you soon!");
    navigate("/login", { replace: true });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setMobileNav}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-fade-in lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col bg-card shadow-popover focus:outline-none data-[state=open]:animate-fade-in lg:hidden">
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Logo to="/app" />
            <DialogPrimitive.Close className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <Link
              to="/app/profile"
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent"
            >
              <UserAvatar user={user} className="h-9 w-9" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.full_name || user?.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{user?.username}</p>
              </div>
            </Link>
            <div className="grid grid-cols-2 gap-1">
              <Link
                to="/app/settings"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

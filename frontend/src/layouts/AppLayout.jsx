import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { SearchCommand } from "@/components/layout/SearchCommand";
import { useNotificationStore } from "@/store/notificationStore";

/** Poll interval for the unread notification badge (ms). */
const NOTIFICATION_POLL_MS = 60_000;

/** Authenticated application shell: sidebar + topbar + routed content. */
export default function AppLayout() {
  const refreshUnread = useNotificationStore((s) => s.refresh);

  // Keep the unread badge fresh while the app is open.
  useEffect(() => {
    refreshUnread();
    const id = setInterval(refreshUnread, NOTIFICATION_POLL_MS);
    function onVisible() {
      if (document.visibilityState === "visible") refreshUnread();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshUnread]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile-only chrome */}
      <MobileNav />
      <MobileDrawer />

      {/* Global command palette */}
      <SearchCommand />
    </div>
  );
}

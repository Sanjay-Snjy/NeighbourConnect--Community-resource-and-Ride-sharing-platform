import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { FullPageSpinner } from "@/components/ui/spinner";

/** Auth pages: bounce already-signed-in users into the app. */
export function PublicOnlyRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner />;
  }

  if (status === "authenticated") {
    const to = location.state?.from?.pathname || "/app";
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { FullPageSpinner } from "@/components/ui/spinner";

/**
 * Gate for authenticated areas. While the session is being re-validated we
 * show a spinner; unauthenticated users are redirected to /login and returned
 * to their target route after signing in.
 */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return <FullPageSpinner label="Getting things ready…" />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

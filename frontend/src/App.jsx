import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster, toast } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/common/ConfirmDialog";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/common/PublicOnlyRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { onUnauthorized } from "@/services/api";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Route-level code splitting keeps the initial bundle lean.
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Feed = lazy(() => import("@/pages/Feed"));
const Resources = lazy(() => import("@/pages/Resources"));
const Carpool = lazy(() => import("@/pages/Carpool"));
const Events = lazy(() => import("@/pages/Events"));
const Messages = lazy(() => import("@/pages/Messages"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Notices = lazy(() => import("@/pages/Notices"));
const Search = lazy(() => import("@/pages/Search"));
const Members = lazy(() => import("@/pages/Members"));
const MemberProfile = lazy(() => import("@/pages/MemberProfile"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function useBootstrap() {
  const initialize = useAuthStore((s) => s.initialize);
  const forceLogout = useAuthStore((s) => s.forceLogout);
  const applyTheme = useUIStore((s) => s.applyTheme);

  useEffect(() => {
    applyTheme();
    initialize();
    const off = onUnauthorized(() => {
      if (useAuthStore.getState().status === "authenticated") {
        toast.error("Your session expired. Please sign in again.");
      }
      forceLogout();
    });
    return off;
  }, [initialize, forceLogout, applyTheme]);
}

export default function App() {
  useBootstrap();

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={200}>
        <ConfirmProvider>
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              {/* Public marketing */}
              <Route path="/" element={<Landing />} />

              {/* Auth (redirects to app when already signed in) */}
              <Route element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
              </Route>

              {/* Protected application */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="feed" element={<Feed />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="carpool" element={<Carpool />} />
                  <Route path="events" element={<Events />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="messages/:conversationId" element={<Messages />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="notices" element={<Notices />} />
                  <Route path="search" element={<Search />} />
                  <Route path="members" element={<Members />} />
                  <Route path="members/:userId" element={<MemberProfile />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </ConfirmProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

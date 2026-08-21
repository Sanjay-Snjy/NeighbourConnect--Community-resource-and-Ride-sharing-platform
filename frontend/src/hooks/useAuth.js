import { useAuthStore } from "@/store/authStore";

/** Convenience accessor over the auth store. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "idle" || status === "loading",
    login,
    register,
    logout,
    setUser,
  };
}

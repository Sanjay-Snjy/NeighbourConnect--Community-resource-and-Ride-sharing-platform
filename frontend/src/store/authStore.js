import { create } from "zustand";
import { authService } from "@/services/auth.service";
import { clearToken, getToken, setToken } from "@/lib/authToken";

/**
 * Auth state machine.
 * status: "idle" -> "loading" -> "authenticated" | "unauthenticated"
 * The token is persisted in localStorage via the authToken holder so sessions
 * survive reloads; `initialize()` re-validates it against the API on boot.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: getToken(),
  status: "idle",

  isAuthenticated: () => get().status === "authenticated",

  async initialize() {
    const token = getToken();
    if (!token) {
      set({ status: "unauthenticated", user: null, token: null });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await authService.me();
      set({ user, token, status: "authenticated" });
    } catch {
      clearToken();
      set({ user: null, token: null, status: "unauthenticated" });
    }
  },

  async login(payload) {
    const { token, user } = await authService.login(payload);
    setToken(token);
    set({ token, user, status: "authenticated" });
    return user;
  },

  async register(payload) {
    const { token, user } = await authService.register(payload);
    setToken(token);
    set({ token, user, status: "authenticated" });
    return user;
  },

  async logout() {
    try {
      await authService.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearToken();
    set({ user: null, token: null, status: "unauthenticated" });
  },

  /** Replace the current user (after a profile update). */
  setUser(user) {
    set({ user });
  },

  /** Called by the Axios 401 handler — drop the session without a round-trip. */
  forceLogout() {
    clearToken();
    set({ user: null, token: null, status: "unauthenticated" });
  },
}));

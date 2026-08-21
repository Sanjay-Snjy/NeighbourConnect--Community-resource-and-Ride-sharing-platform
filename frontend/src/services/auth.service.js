import api from "./api";

/**
 * Authentication + current-user profile.
 * All auth endpoints return { token, user } except `me`/`updateProfile`.
 */
export const authService = {
  async register(payload) {
    const { data } = await api.post("/auth/register/", payload);
    return data; // { token, user }
  },

  async login(payload) {
    const { data } = await api.post("/auth/login/", payload);
    return data; // { token, user }
  },

  async logout() {
    await api.post("/auth/logout/");
  },

  async me() {
    const { data } = await api.get("/auth/me/");
    return data; // user
  },

  /** Update name + profile (bio, neighborhood, phone, avatar). */
  async updateProfile(formData) {
    const { data } = await api.patch("/users/me/", formData);
    return data; // user
  },
};

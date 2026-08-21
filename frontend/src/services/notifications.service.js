import api from "./api";

export const notificationsService = {
  async list(params = {}) {
    const { data } = await api.get("/notifications/", { params });
    return data; // paginated
  },

  async unreadCount() {
    const { data } = await api.get("/notifications/unread-count/");
    return data.unread ?? 0;
  },

  async markRead(id) {
    const { data } = await api.post(`/notifications/${id}/read/`);
    return data;
  },

  async markAllRead() {
    const { data } = await api.post("/notifications/read-all/");
    return data; // { updated }
  },
};

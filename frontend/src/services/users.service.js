import api from "./api";

export const usersService = {
  async list(params = {}) {
    const { data } = await api.get("/users/", { params });
    return data; // paginated
  },

  async get(id) {
    const { data } = await api.get(`/users/${id}/`);
    return data;
  },

  async me() {
    const { data } = await api.get("/users/me/");
    return data;
  },
};

import api from "./api";

export const noticesService = {
  async list(params = {}) {
    const { data } = await api.get("/notices/", { params });
    return data; // paginated
  },

  async get(id) {
    const { data } = await api.get(`/notices/${id}/`);
    return data;
  },

  async create(values) {
    const { data } = await api.post("/notices/", values);
    return data;
  },

  async update(id, values) {
    const { data } = await api.patch(`/notices/${id}/`, values);
    return data;
  },

  async remove(id) {
    await api.delete(`/notices/${id}/`);
  },
};

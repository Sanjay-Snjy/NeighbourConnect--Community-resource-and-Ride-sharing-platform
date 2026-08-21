import api from "./api";
import { hasFile, toFormData } from "@/lib/formData";

export const resourcesService = {
  async list(params = {}) {
    const { data } = await api.get("/resources/", { params });
    return data; // paginated
  },

  async get(id) {
    const { data } = await api.get(`/resources/${id}/`);
    return data;
  },

  async mine(params = {}) {
    const { data } = await api.get("/resources/mine/", { params });
    return data; // paginated
  },

  async create(values) {
    const body = hasFile(values) ? toFormData(values) : values;
    const { data } = await api.post("/resources/", body);
    return data;
  },

  async update(id, values) {
    const body = hasFile(values) ? toFormData(values) : values;
    const { data } = await api.patch(`/resources/${id}/`, body);
    return data;
  },

  async remove(id) {
    await api.delete(`/resources/${id}/`);
  },

  /** Borrow request from a non-owner. */
  async requestItem(id, message = "") {
    const { data } = await api.post(`/resources/${id}/request/`, { message });
    return data; // resource request
  },

  async toggleAvailability(id) {
    const { data } = await api.patch(`/resources/${id}/availability/`);
    return data; // resource
  },

  /** Owner-only: list requests on a resource. */
  async requests(id) {
    const { data } = await api.get(`/resources/${id}/requests/`);
    return data; // array
  },
};

export const resourceRequestsService = {
  async list(params = {}) {
    const { data } = await api.get("/resource-requests/", { params });
    return data; // paginated
  },

  async accept(id) {
    const { data } = await api.post(`/resource-requests/${id}/accept/`);
    return data;
  },

  async reject(id) {
    const { data } = await api.post(`/resource-requests/${id}/reject/`);
    return data;
  },
};

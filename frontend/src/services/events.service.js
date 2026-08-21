import api from "./api";
import { hasFile, toFormData } from "@/lib/formData";

export const eventsService = {
  async list(params = {}) {
    const { data } = await api.get("/events/", { params });
    return data; // paginated
  },

  async get(id) {
    const { data } = await api.get(`/events/${id}/`);
    return data;
  },

  async mine(params = {}) {
    const { data } = await api.get("/events/mine/", { params });
    return data; // paginated
  },

  async create(values) {
    const body = hasFile(values) ? toFormData(values) : values;
    const { data } = await api.post("/events/", body);
    return data;
  },

  async update(id, values) {
    const body = hasFile(values) ? toFormData(values) : values;
    const { data } = await api.patch(`/events/${id}/`, body);
    return data;
  },

  async remove(id) {
    await api.delete(`/events/${id}/`);
  },

  async join(id) {
    const { data } = await api.post(`/events/${id}/join/`);
    return data; // { is_attending, attendee_count }
  },

  async leave(id) {
    const { data } = await api.post(`/events/${id}/leave/`);
    return data; // { is_attending, attendee_count }
  },

  async attendees(id) {
    const { data } = await api.get(`/events/${id}/attendees/`);
    return data; // array of users
  },
};

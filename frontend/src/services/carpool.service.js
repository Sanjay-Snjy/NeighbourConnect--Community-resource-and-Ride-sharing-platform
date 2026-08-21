import api from "./api";

export const carpoolService = {
  async list(params = {}) {
    const { data } = await api.get("/rides/", { params });
    return data; // paginated
  },

  async get(id) {
    const { data } = await api.get(`/rides/${id}/`);
    return data;
  },

  async mine(params = {}) {
    const { data } = await api.get("/rides/mine/", { params });
    return data; // paginated
  },

  async create(values) {
    const { data } = await api.post("/rides/", values);
    return data;
  },

  async update(id, values) {
    const { data } = await api.patch(`/rides/${id}/`, values);
    return data;
  },

  async remove(id) {
    await api.delete(`/rides/${id}/`);
  },

  /** Ask to join a ride (seats + optional message). */
  async requestSeat(id, { seats = 1, message = "" } = {}) {
    const { data } = await api.post(`/rides/${id}/request/`, { seats, message });
    return data; // ride request
  },

  /** Owner-only: list join requests on a ride. */
  async requests(id) {
    const { data } = await api.get(`/rides/${id}/requests/`);
    return data; // array
  },

  /** Suggested matching rides (opposite type, same day, matching route). */
  async matches(id) {
    const { data } = await api.get(`/rides/${id}/matches/`);
    return data; // array
  },
};

export const rideRequestsService = {
  async list(params = {}) {
    const { data } = await api.get("/ride-requests/", { params });
    return data; // paginated
  },

  async accept(id) {
    const { data } = await api.post(`/ride-requests/${id}/accept/`);
    return data;
  },

  async reject(id) {
    const { data } = await api.post(`/ride-requests/${id}/reject/`);
    return data;
  },
};

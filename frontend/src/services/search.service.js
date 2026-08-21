import api from "./api";

export const searchService = {
  /** Global search across people, posts, resources, events and rides. */
  async query(q, config = {}) {
    const { data } = await api.get("/search/", { params: { q }, ...config });
    return data; // { query, people, posts, resources, events, rides }
  },
};

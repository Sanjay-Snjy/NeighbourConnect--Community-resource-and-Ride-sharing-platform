import api from "./api";
import { toFormData } from "@/lib/formData";

export const postsService = {
  async list(params = {}) {
    const { data } = await api.get("/posts/", { params });
    return data; // paginated
  },

  async get(id) {
    const { data } = await api.get(`/posts/${id}/`);
    return data;
  },

  /**
   * Create a post. An image (File) is sent as multipart; a poll is sent as
   * JSON. The composer keeps image and poll mutually exclusive.
   */
  async create({ content = "", image = null, poll = null }) {
    if (image instanceof File) {
      const { data } = await api.post("/posts/", toFormData({ content, image }));
      return data;
    }
    const body = { content };
    if (poll) body.poll = poll;
    const { data } = await api.post("/posts/", body);
    return data;
  },

  async remove(id) {
    await api.delete(`/posts/${id}/`);
  },

  /** Toggle like. Returns { is_liked, like_count }. */
  async toggleLike(id) {
    const { data } = await api.post(`/posts/${id}/like/`);
    return data;
  },

  async listComments(id, params = {}) {
    const { data } = await api.get(`/posts/${id}/comments/`, { params });
    return data; // paginated
  },

  async addComment(id, content) {
    const { data } = await api.post(`/posts/${id}/comments/`, { content });
    return data; // comment
  },

  /** Cast poll vote(s). `options` is an array of option ids. */
  async vote(id, options) {
    const { data } = await api.post(`/posts/${id}/vote/`, { options });
    return data; // poll
  },
};

export const commentsService = {
  async remove(id) {
    await api.delete(`/comments/${id}/`);
  },
};

import api from "./api";

export const messagesService = {
  async conversations(params = {}) {
    const { data } = await api.get("/conversations/", { params });
    return data; // paginated
  },

  async getConversation(id) {
    const { data } = await api.get(`/conversations/${id}/`);
    return data;
  },

  /** Start (or fetch existing) a direct conversation with another user. */
  async startConversation(participantId) {
    const { data } = await api.post("/conversations/", {
      participant_id: participantId,
    });
    return data; // conversation
  },

  /** Fetch messages (also marks the other party's messages as read). */
  async messages(conversationId) {
    const { data } = await api.get(`/conversations/${conversationId}/messages/`);
    return data; // array of messages
  },

  async send(conversationId, content) {
    const { data } = await api.post(
      `/conversations/${conversationId}/messages/`,
      { content },
    );
    return data; // message
  },

  async markRead(conversationId) {
    const { data } = await api.post(`/conversations/${conversationId}/read/`);
    return data;
  },
};

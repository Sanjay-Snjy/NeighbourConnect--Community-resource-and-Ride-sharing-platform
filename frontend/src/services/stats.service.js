import api from "./api";

export const statsService = {
  /**
   * Public, community-wide totals for the marketing landing page.
   * No auth required — returns real aggregate counts (no personal data).
   */
  async community() {
    const { data } = await api.get("/stats/community/");
    return data; // { neighbors, resources_shared, rides_coordinated, events_hosted }
  },
};

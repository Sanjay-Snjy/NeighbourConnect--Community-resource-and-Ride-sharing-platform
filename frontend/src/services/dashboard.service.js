import api from "./api";

export const dashboardService = {
  /** Aggregate counts + a small activity slice for the dashboard. */
  async stats() {
    const { data } = await api.get("/stats/dashboard/");
    return data; // { stats, upcoming_events, recent_notices }
  },
};

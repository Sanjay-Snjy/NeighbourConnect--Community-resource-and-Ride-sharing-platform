import { create } from "zustand";
import { notificationsService } from "@/services/notifications.service";

/** Small store just for the unread badge in the top bar / nav. */
export const useNotificationStore = create((set, get) => ({
  unread: 0,

  async refresh() {
    try {
      const unread = await notificationsService.unreadCount();
      set({ unread });
    } catch {
      /* non-critical — leave the badge as-is */
    }
  },

  setUnread(unread) {
    set({ unread: Math.max(0, unread) });
  },

  decrement(by = 1) {
    set({ unread: Math.max(0, get().unread - by) });
  },

  reset() {
    set({ unread: 0 });
  },
}));

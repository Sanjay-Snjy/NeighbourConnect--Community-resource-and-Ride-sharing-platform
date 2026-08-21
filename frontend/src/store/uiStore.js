import { create } from "zustand";

const THEME_KEY = "neighbourhub.theme";
const SIDEBAR_KEY = "neighbourhub.sidebar";

function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "light";
}

function readSidebar() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "collapsed";
  } catch {
    return false;
  }
}

/** UI chrome: theme, desktop sidebar collapse, mobile drawer, command palette. */
export const useUIStore = create((set, get) => ({
  theme: readTheme(),
  sidebarCollapsed: readSidebar(),
  mobileNavOpen: false,
  searchOpen: false,

  applyTheme() {
    const { theme } = get();
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  },

  setTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
    set({ theme });
    document.documentElement.classList.toggle("dark", theme === "dark");
  },

  toggleTheme() {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },

  toggleSidebar() {
    const next = !get().sidebarCollapsed;
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "expanded");
    } catch {
      /* ignore */
    }
    set({ sidebarCollapsed: next });
  },

  setMobileNav(open) {
    set({ mobileNavOpen: open });
  },

  setSearchOpen(open) {
    set({ searchOpen: open });
  },
}));

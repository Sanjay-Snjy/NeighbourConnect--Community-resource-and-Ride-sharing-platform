import {
  CalendarDays,
  Car,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Newspaper,
  Package,
  Users,
} from "lucide-react";

/** Primary navigation shown in the sidebar and mobile drawer. */
export const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/feed", label: "Community Feed", icon: Newspaper },
  { to: "/app/resources", label: "Resources", icon: Package },
  { to: "/app/carpool", label: "Carpool", icon: Car },
  { to: "/app/events", label: "Events", icon: CalendarDays },
  { to: "/app/messages", label: "Messages", icon: MessageCircle },
  { to: "/app/notices", label: "Notices", icon: Megaphone },
  { to: "/app/members", label: "Members", icon: Users },
];

/** Condensed set for the mobile bottom navigation bar. */
export const MOBILE_NAV_ITEMS = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/feed", label: "Feed", icon: Newspaper },
  { to: "/app/resources", label: "Share", icon: Package },
  { to: "/app/events", label: "Events", icon: CalendarDays },
  { to: "/app/messages", label: "Messages", icon: MessageCircle },
];

import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from "date-fns";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** "3h ago", "2d ago" — compact relative time for feeds & notifications. */
export function timeAgo(value) {
  const date = toDate(value);
  if (!date) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true })
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d")
    .replace(" months", "mo")
    .replace(" month", "mo")
    .replace(" years", "y")
    .replace(" year", "y");
}

/** "Mon, Jun 3, 2025" */
export function formatDate(value, pattern = "EEE, MMM d, yyyy") {
  const date = toDate(value);
  return date ? format(date, pattern) : "";
}

/** Human day label used on event cards: Today / Tomorrow / Mon, Jun 3 */
export function friendlyDay(value) {
  const date = toDate(value);
  if (!date) return "";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

/** "09:00" (24h from API) -> "9:00 AM" */
export function formatTime(value) {
  if (!value) return "";
  const [h, m] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m || 0), 0, 0);
  return format(date, "h:mm a");
}

/** Range like "9:00 AM – 11:30 AM" */
export function formatTimeRange(start, end) {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

/** Initials from a full name, e.g. "Priya Nair" -> "PN" */
export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic accent color for an avatar fallback, keyed by a string. */
const AVATAR_TINTS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];
export function tintFor(key = "") {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

/** Pluralize a count: pluralize(1, "seat") -> "1 seat". */
export function pluralize(count, singular, plural) {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/** Truncate long text with an ellipsis. */
export function truncate(text = "", max = 120) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

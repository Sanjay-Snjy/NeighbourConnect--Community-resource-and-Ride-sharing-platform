/**
 * Enumerations mirrored from the Django models (api/models.py TextChoices).
 * Keep these in sync with the backend; they drive filters, selects and badges.
 */

export const RESOURCE_CATEGORIES = [
  { value: "books", label: "Books", icon: "BookOpen" },
  { value: "tools", label: "Tools", icon: "Wrench" },
  { value: "sports", label: "Sports", icon: "Dumbbell" },
  { value: "food", label: "Food", icon: "UtensilsCrossed" },
  { value: "other", label: "Other", icon: "Package" },
];

export const EVENT_CATEGORIES = [
  { value: "cleanup", label: "Cleanup", icon: "Sparkles" },
  { value: "sports", label: "Sports", icon: "Trophy" },
  { value: "meeting", label: "Meeting", icon: "Users" },
  { value: "festival", label: "Festival", icon: "PartyPopper" },
  { value: "workshop", label: "Workshop", icon: "Hammer" },
  { value: "study", label: "Study", icon: "GraduationCap" },
  { value: "other", label: "Other", icon: "CalendarDays" },
];

export const NOTICE_PRIORITIES = [
  { value: "low", label: "Low", tone: "muted" },
  { value: "normal", label: "Normal", tone: "info" },
  { value: "high", label: "High", tone: "warning" },
  { value: "urgent", label: "Urgent", tone: "danger" },
];

export const NOTICE_CATEGORIES = [
  { value: "water", label: "Water", icon: "Droplets" },
  { value: "security", label: "Security", icon: "ShieldAlert" },
  { value: "maintenance", label: "Maintenance", icon: "Wrench" },
  { value: "meeting", label: "Meeting", icon: "Users" },
  { value: "emergency", label: "Emergency", icon: "Siren" },
  { value: "general", label: "General", icon: "Megaphone" },
];

export const RIDE_TYPES = [
  { value: "offer", label: "Offering a ride", short: "Offering" },
  { value: "request", label: "Looking for a ride", short: "Looking" },
];

export const REQUEST_STATUS = {
  pending: { label: "Pending", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Declined", tone: "danger" },
  completed: { label: "Completed", tone: "info" },
};

export const RIDE_STATUS = {
  active: { label: "Active", tone: "success" },
  full: { label: "Full", tone: "warning" },
  completed: { label: "Completed", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export function labelFor(options, value) {
  return options.find((o) => o.value === value)?.label ?? value;
}

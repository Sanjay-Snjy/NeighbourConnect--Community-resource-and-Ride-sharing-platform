import {
  BookOpen,
  Wrench,
  Dumbbell,
  UtensilsCrossed,
  Package,
  Sparkles,
  Trophy,
  Users,
  PartyPopper,
  Hammer,
  GraduationCap,
  CalendarDays,
  Droplets,
  ShieldAlert,
  Siren,
  Megaphone,
} from "lucide-react";

/**
 * Explicit registry mapping the icon name strings stored in
 * `@/utils/constants` to their Lucide components. Kept explicit (rather than a
 * wildcard import) so bundlers can tree-shake unused icons.
 */
const REGISTRY = {
  BookOpen,
  Wrench,
  Dumbbell,
  UtensilsCrossed,
  Package,
  Sparkles,
  Trophy,
  Users,
  PartyPopper,
  Hammer,
  GraduationCap,
  CalendarDays,
  Droplets,
  ShieldAlert,
  Siren,
  Megaphone,
};

/** Render a category's Lucide icon by its registry name, falling back to Package. */
export function CategoryIcon({ name, ...props }) {
  const Icon = REGISTRY[name] ?? Package;
  return <Icon {...props} />;
}

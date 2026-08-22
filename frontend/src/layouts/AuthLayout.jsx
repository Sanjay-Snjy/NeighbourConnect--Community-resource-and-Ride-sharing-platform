import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Car, MessagesSquare, Package } from "lucide-react";
import { Logo } from "@/components/common/Logo";

const HIGHLIGHTS = [
  { icon: Package, label: "Share tools, books & everyday items" },
  { icon: Car, label: "Coordinate carpools to work & school" },
  { icon: CalendarDays, label: "Plan cleanups, festivals & meetups" },
  { icon: MessagesSquare, label: "Message neighbours directly" },
];

/** Split-screen auth shell: form on the left, brand story on the right. */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_1.05fr]">
      {/* Form column */}
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:min-h-0">
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back home
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Brand column */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-grid opacity-[0.12]" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex h-full flex-col justify-center px-14 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Your neighborhood, connected.
            </p>
            <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight">
              Everything your community needs, in one calm place.
            </h2>
            <p className="mt-4 text-white/80">
              NeighbourConnect brings the small acts that make a neighborhood feel like
              home — lending, sharing rides, showing up — into a single, friendly
              app.
            </p>
            <ul className="mt-10 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, label }, i) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[0.95rem] text-white/90">{label}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

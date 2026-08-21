import { motion } from "framer-motion";
import { Bell, CalendarDays, Car, Heart, MessageCircle, Package } from "lucide-react";

/** A self-contained, image-free preview of the product for the hero. */
export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Window frame */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border bg-background/60 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-400/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          <div className="ml-3 flex-1">
            <div className="mx-auto h-5 w-40 rounded-md bg-muted" />
          </div>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-14 shrink-0 flex-col items-center gap-4 border-r border-border py-4 sm:flex">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            {[Heart, Package, Car, CalendarDays].map((Icon, i) => (
              <div
                key={i}
                className={
                  "flex h-8 w-8 items-center justify-center rounded-lg " +
                  (i === 0 ? "bg-primary-50 text-primary-600" : "text-muted-foreground")
                }
              >
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </div>

          {/* Feed body */}
          <div className="flex-1 space-y-3 p-4">
            {/* Composer */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="h-8 w-8 rounded-full bg-primary-100" />
              <div className="h-4 flex-1 rounded-full bg-muted" />
            </div>

            {/* Post card */}
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded bg-foreground/80" />
                  <div className="h-2.5 w-16 rounded bg-muted" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
              <div className="mt-3 h-24 rounded-lg bg-gradient-to-br from-primary-50 to-muted" />
              <div className="mt-3 flex items-center gap-5 text-muted-foreground">
                <span className="flex items-center gap-1.5 text-xs">
                  <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> 24
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" /> 6
                </span>
              </div>
            </div>

            {/* Poll card */}
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="h-3 w-40 rounded bg-foreground/70" />
              <div className="mt-3 space-y-2">
                <div className="relative h-7 overflow-hidden rounded-md bg-muted">
                  <div className="absolute inset-y-0 left-0 w-3/5 rounded-md bg-primary-100" />
                </div>
                <div className="relative h-7 overflow-hidden rounded-md bg-muted">
                  <div className="absolute inset-y-0 left-0 w-2/5 rounded-md bg-primary-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute -right-3 top-16 hidden items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-popover sm:flex"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">New ride offer</p>
          <p className="text-2xs text-muted-foreground">3 seats · to Downtown</p>
        </div>
      </motion.div>

      {/* Floating resource chip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.5 }}
        className="absolute -left-4 bottom-10 hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-popover sm:flex"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
          <Package className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-foreground">Drill · Available</p>
      </motion.div>
    </div>
  );
}

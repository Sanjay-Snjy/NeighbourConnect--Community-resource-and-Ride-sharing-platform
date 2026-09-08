import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Car,
  Check,
  Heart,
  MapPin,
  Megaphone,
  MessagesSquare,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Reveal } from "@/components/common/Reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { statsService } from "@/services/stats.service";
import { HeroMockup } from "@/components/landing/HeroMockup";
import { FaqItem } from "@/components/landing/FaqItem";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Community feed",
    body: "Share updates, photos, and polls. React and comment to keep the conversation going — no algorithms, just your neighbors.",
  },
  {
    icon: Package,
    title: "Resource sharing",
    body: "Lend a ladder, borrow a drill, give away what you no longer need. A friendly marketplace built on trust, not transactions.",
  },
  {
    icon: Car,
    title: "Carpool & rides",
    body: "Offer a seat or request a lift. Smart matching pairs riders with drivers heading the same way.",
  },
  {
    icon: CalendarDays,
    title: "Local events",
    body: "Plan block parties, cleanups, and meetups. RSVP, track attendance, and never miss what's happening nearby.",
  },
  {
    icon: Megaphone,
    title: "Community notices",
    body: "Post lost-and-found, safety alerts, and important announcements — pinned where everyone can see them.",
  },
  {
    icon: Bell,
    title: "Direct messaging",
    body: "Private one-to-one conversations with real-time notifications, so coordinating is effortless.",
  },
];

const STEPS = [
  {
    icon: MapPin,
    title: "Join your neighborhood",
    body: "Create an account and tell us where you live. You're instantly connected to the people around you.",
  },
  {
    icon: Users,
    title: "Meet your neighbors",
    body: "Browse the feed, discover shared resources, and see who's organizing what — all in one calm place.",
  },
  {
    icon: Heart,
    title: "Build something together",
    body: "Share, plan, and help each other out. Small acts add up to a stronger, kinder community.",
  },
];

// Labels for the live community stats. Values are fetched from the public
// /stats/community/ endpoint — never hard-coded.
const STAT_METERS = [
  { key: "neighbors", label: "Neighbors connected" },
  { key: "resources_shared", label: "Resources shared" },
  { key: "rides_coordinated", label: "Rides coordinated" },
  { key: "events_hosted", label: "Events hosted" },
];

const FAQS = [
  {
    q: "Is NeighbourConnect free to use?",
    a: "Yes. Joining your neighborhood, posting to the feed, sharing resources, and coordinating rides and events are all free.",
  },
  {
    q: "Who can see what I post?",
    a: "Your posts, resources, and events are shared with members of your neighborhood community. Direct messages stay private between you and the recipient.",
  },
  {
    q: "How does carpool matching work?",
    a: "When you offer a ride, we surface it to neighbors requesting lifts along a similar route and time. You always approve who joins before anything is confirmed.",
  },
  {
    q: "Can I control my notifications?",
    a: "Absolutely. You decide what you're notified about, and there's no noisy algorithmic feed — you see what your neighbors actually share, in order.",
  },
  {
    q: "Is my data safe?",
    a: "Your account is protected with secure authentication, and you control your own content. You can edit or delete anything you've posted at any time.",
  },
];

export default function Landing() {
  useDocumentTitle("Your neighborhood. Connected.");

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("hide-scrollbar");
    return () => document.documentElement.classList.remove("hide-scrollbar");
  }, []);

  useEffect(() => {
    let active = true;
    statsService
      .community()
      .then((data) => active && setStats(data))
      .catch(() => active && setStatsError(true))
      .finally(() => active && setStatsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dark min-h-screen bg-background">
      <LandingNav />

      <main>
        {/* ===== Hero ===== */}
        <section
  className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('/assets/bg.png')" }}
>
          <div className="pointer-events-none absolute inset-0  opacity-[0.5]" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className=" w-full  text-center pt-28 pb-16 sm:pt-32 sm:px-10 lg:pt-44 lg:pb-36">
            <div className=" ml-[00px] grid gap-12 lg:grid-cols-1">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground shadow-subtle"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  The modern home for your neighborhood
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8 text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-5xl"
                >
                Where your neighborhood,{" "}  <br></br>
                  <span className="text-primary">comes together</span>.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6  text-lg text-white/50"
                >
                  Share resources, coordinate rides, plan events, and stay in the loop — all in one<br></br>
                  calm, private place built for the people right next door.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-12 flex justify-center flex-col gap-4 sm:flex-row"
                >
                  <Button size="lg" asChild className="rounded-[40px] text-white/90 border border-white/50">
                    <Link to="/register">
                      Get started 
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-[40px] text-white hover:bg-indigo-400 hover:border-white">
                    <a href="#how">See how it works</a>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.28 }}
                  className="mt-8  flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-white"
                >
                  <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-[20px] backdrop-blur-lg px-4 py-2">
                    <Check className="h-4 w-4 text-success" /> Connect with neighbors
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-[20px] backdrop-blur-lg px-4 py-2">
                    <Check className="h-4 w-4 text-success" /> Discover what's nearby
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-[20px] backdrop-blur-lg px-4 py-2">
                    <Check className="h-4 w-4 text-success" /> Stay in the loop
                  </span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
               
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== Trust strip (live community stats) ===== */}
        {!statsError && (
          <section className="border-y border-border bg-card">
            <div className="container-page py-8">
              <p className="text-center text-sm font-medium text-muted-foreground">
                The NeighbourConnect community, by the numbers
              </p>
              <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {STAT_METERS.map((s) => (
                  <div key={s.key} className="text-center">
                    {statsLoading ? (
                      <Skeleton className="mx-auto h-8 w-16 sm:h-9" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground sm:text-3xl">
                        {(stats?.[s.key] ?? 0).toLocaleString()}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== Features ===== */}
        <section id="features" className="scroll-mt-20">
          <div className="container-page py-20 lg:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Everything in one place
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                One app for the whole neighborhood
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Six thoughtfully designed modules that replace a dozen group chats, spreadsheets,
                and flyers on the noticeboard.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.05}>
                  <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-subtle transition-shadow hover:shadow-card">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section id="how" className="scroll-mt-20 bg-card">
          <div className="container-page border-y border-border py-20 lg:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Up and running in minutes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No complicated setup. Join, look around, and start helping out.
              </p>
            </Reveal>

            <div className="relative mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-subtle">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="mx-auto mt-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

       

        {/* ===== Spotlight: Events (reversed) ===== */}
        <section id="community" className="scroll-mt-20 ">
          <div className="container-page border-y border-border py-20 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Reveal className="order-2 lg:order-1" delay={0.1}>
                <SpotlightEvents />
              </Reveal>
              <Reveal className="order-1 lg:order-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Bring people together
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Events that actually happen
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  From block parties to book clubs, planning is effortless. Set a date, cap the
                  guest list, and let neighbors RSVP. Reminders handle the rest.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Public or private events with capacity limits",
                    "One-tap RSVP and live attendee counts",
                    "Automatic reminders so no one forgets",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" className="scroll-mt-20 bg-card">
          <div className="container-page border-y border-border py-20 lg:py-28">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Questions & answers
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you might be wondering
              </h2>
            </Reveal>

            <div className="mx-auto mt-12 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-background">
              {FAQS.map((faq) => (
                <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>

       
      </main>

      <LandingFooter />
    </div>
  );
}

/* ---- Inline spotlight visuals (self-contained, no images) ---- */

function SpotlightResources() {
  const items = [
    { name: "Cordless drill", owner: "Marcus T.", tag: "Tools", available: true },
    { name: "Folding tables (x4)", owner: "Aisha K.", tag: "Events", available: true },
    { name: "Kids' bike, 20\"", owner: "Elena R.", tag: "Kids", available: false },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Shared resources</span>
        </div>
        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
          Near you
        </span>
      </div>
      <div className="space-y-2.5">
        {items.map((it) => (
          <div
            key={it.name}
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
              <p className="text-xs text-muted-foreground">
                {it.tag} · {it.owner}
              </p>
            </div>
            <span
              className={
                it.available
                  ? "rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                  : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {it.available ? "Available" : "On loan"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpotlightEvents() {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">This weekend</span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-[0.625rem] font-semibold uppercase leading-none">Sat</span>
            <span className="text-lg font-bold leading-none">14</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Community garden cleanup</p>
            <p className="mt-0.5 text-sm text-muted-foreground">10:00 AM · Elm Street Park</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex -space-x-2">
            {["A", "B", "C", "D"].map((l, i) => (
              <div
                key={l}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary-100 text-2xs font-semibold text-primary-700"
                style={{ zIndex: 10 - i }}
              >
                {l}
              </div>
            ))}
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-2xs font-semibold text-muted-foreground">
              +9
            </div>
          </div>
          <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Going
          </span>
        </div>
      </div>
    </div>
  );
}

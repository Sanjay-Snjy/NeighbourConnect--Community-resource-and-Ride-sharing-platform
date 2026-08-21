import { Link } from "react-router-dom";
import { Logo } from "@/components/common/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Community", href: "#community" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Modules",
    links: [
      { label: "Community feed", href: "#features" },
      { label: "Resource sharing", href: "#features" },
      { label: "Carpool", href: "#features" },
      { label: "Events", href: "#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#community" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo to="/" />
            <p className="mt-4 text-sm text-muted-foreground">
              Your neighborhood. Connected. Share resources, coordinate rides, plan events, and
              stay in the loop — all in one calm, private place.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NeighbourHub. Built for good neighbors.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <span className="text-border">·</span>
            <Link to="/register" className="text-sm font-medium text-primary hover:text-primary-700">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

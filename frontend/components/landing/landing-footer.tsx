import Link from "next/link";

import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "AI Intelligence", href: "#ai" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Organizations", href: "#organizations" },
      { label: "Security", href: "#security" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Get Started", href: "/register" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="glass border-t border-border/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              AI-powered meeting intelligence for smarter conversations, clearer
              decisions, and accountable execution.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-foreground">{column.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group relative inline-block transition-colors hover:text-primary"
                      >
                        {link.label}
                        <span
                          className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-primary to-violet transition-transform duration-300 group-hover:scale-x-100"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} IntelliConnect. All rights reserved.</p>
          <p className="bg-gradient-to-r from-primary to-violet bg-clip-text font-medium text-transparent">
            Turn Every Conversation Into Action.
          </p>
        </div>
      </div>
    </footer>
  );
}
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
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
            <div>
              <p className="text-sm font-semibold text-foreground">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground">How It Works</a></li>
                <li><a href="#ai" className="hover:text-foreground">AI Intelligence</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#organizations" className="hover:text-foreground">Organizations</a></li>
                <li><a href="#security" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Account</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-foreground">Get Started</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} IntelliConnect. All rights reserved.</p>
          <p>Turn Every Conversation Into Action.</p>
        </div>
      </div>
    </footer>
  );
}

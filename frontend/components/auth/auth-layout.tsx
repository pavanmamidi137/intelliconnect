import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { AIEngine } from "@/components/illustrations/ai-engine";
import { Logo } from "@/components/brand/logo";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="hero-mesh absolute inset-0" aria-hidden="true" />
      <div
        className="glow-orb left-[8%] top-[14%] h-72 w-72 bg-[#6366f1]/[0.22]"
        aria-hidden="true"
      />
      <div
        className="glow-orb right-[4%] top-[40%] h-80 w-80 bg-[#8b5cf6]/[0.16]"
        style={{ animationDelay: "-6s" }}
        aria-hidden="true"
      />
      <div
        className="glow-orb bottom-[6%] left-[20%] h-64 w-64 bg-[#06b6d4]/[0.1]"
        style={{ animationDelay: "-11s" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full flex-col items-center justify-center">
        <Link
          href="/"
          className="absolute left-0 top-0 transition-transform duration-300 hover:scale-[1.03]"
          aria-label="IntelliConnect home"
        >
          <Logo />
        </Link>

        <div className="pointer-events-none absolute right-[4%] top-1/2 hidden -translate-y-1/2 opacity-35 xl:block">
          <AIEngine className="scale-125" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-primary/15 via-cyan-400/10 to-violet-400/15 blur-3xl" aria-hidden="true" />
          <div className="liquid-glass gradient-border relative rounded-[2rem] p-6 shadow-[var(--shadow-glass-hover)] sm:p-9">
            <div className="mb-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Your meeting command center
            </div>
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            {children}
          </div>
        </div>

        <p className="absolute bottom-0 left-0 text-xs text-muted-foreground">
          © {new Date().getFullYear()} IntelliConnect · Secure, private, enterprise-ready.
        </p>
      </div>
    </div>
  );
}
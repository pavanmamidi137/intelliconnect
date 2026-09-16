import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Ambient mesh + orbs spanning the whole auth view */}
      <div className="hero-mesh absolute inset-0" aria-hidden="true" />
      <div
        className="glow-orb left-[8%] top-[14%] h-72 w-72 bg-blue-500/20"
        aria-hidden="true"
      />
      <div
        className="glow-orb right-[4%] top-[40%] h-80 w-80 bg-sky-500/15"
        style={{ animationDelay: "-6s" }}
        aria-hidden="true"
      />

      {/* Branding panel — desktop only */}
      <div className="relative z-10 hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border/60 p-12 lg:flex">
        <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="glass-surface absolute inset-4 rounded-3xl" aria-hidden="true" />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.03]"
            aria-label="IntelliConnect home"
          >
            <LogoMark />
            <span className="text-xl font-bold tracking-tight text-foreground">IntelliConnect</span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 animate-[var(--animate-glow-pulse)]" aria-hidden="true" />
            AI-powered meeting intelligence
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Turn Every{" "}
            <span className="text-gradient-premium">Conversation</span> Into Action.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Summaries, decisions, tasks, and professional reports — generated from
            your meeting transcripts automatically.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Smart summaries and key discussion points",
              "Tasks matched to the right people with confidence",
              "Professional PDF reports in one click",
            ].map((item) => (
              <div
                key={item}
                className="glass glass-hover flex items-start gap-3 rounded-xl p-3.5 text-sm text-foreground/90"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path d="M5 10l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} IntelliConnect. Secure, private, enterprise-ready.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="glass-strong gradient-border rounded-2xl p-6 shadow-[var(--shadow-glass-hover)] sm:p-8">
            <div className="mb-6 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.03]"
                aria-label="IntelliConnect home"
              >
                <LogoMark />
                <span className="text-lg font-bold tracking-tight text-foreground">IntelliConnect</span>
              </Link>
            </div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-9 w-9" aria-hidden="true">
      <defs>
        <linearGradient id="auth-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#auth-grad)" />
      <circle cx="13" cy="12" r="3.4" fill="white" />
      <circle cx="27" cy="12" r="3.4" fill="white" fillOpacity="0.55" />
      <circle cx="13" cy="28" r="3.4" fill="white" fillOpacity="0.55" />
      <circle cx="27" cy="28" r="3.4" fill="white" />
      <circle cx="20" cy="20" r="4.6" fill="white" />
      <path
        d="M13 12h14M13 12l7 8m7-8l-7 8m-7 8h14m-14 0l7-8m7 8l-7-8"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
    </svg>
  );
}
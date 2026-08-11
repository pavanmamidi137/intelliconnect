import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Branding panel — desktop only */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="hero-grid absolute inset-0 opacity-30" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-violet-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="IntelliConnect home">
            <LogoMark />
            <span className="text-xl font-bold tracking-tight text-white">IntelliConnect</span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-powered meeting intelligence
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Turn Every Conversation Into Action.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-indigo-100/90">
            Summaries, decisions, tasks, and professional reports — generated from
            your meeting transcripts automatically.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Smart summaries and key discussion points",
              "Tasks matched to the right people with confidence",
              "Professional PDF reports in one click",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-indigo-50">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path d="M5 10l3 3 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-indigo-200/70">
          © {new Date().getFullYear()} IntelliConnect. Secure, private, enterprise-ready.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="IntelliConnect home">
              <LogoMark />
              <span className="text-lg font-bold tracking-tight text-foreground">IntelliConnect</span>
            </Link>
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
    </div>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-9 w-9" aria-hidden="true">
      <defs>
        <linearGradient id="auth-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
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

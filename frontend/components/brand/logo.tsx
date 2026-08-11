import { cn } from "@/lib/utils";

/**
 * IntelliConnect brand mark — connected conversation nodes forming an
 * abstract "I" / network symbol. Used across navbar, sidebar, auth pages
 * and the PDF report header.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
    >
      <defs>
        <linearGradient id="ic-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#ic-grad)" />
      <rect x="1" y="1" width="38" height="38" rx="11" stroke="rgba(255,255,255,0.15)" />
      {/* conversation nodes forming an abstract I */}
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

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={compact ? "h-8 w-8" : "h-9 w-9"} />
      {!compact && (
        <span className="font-display text-xl font-semibold leading-none text-foreground">
          Intelli<span className="text-gradient">Connect</span>
        </span>
      )}
    </span>
  );
}

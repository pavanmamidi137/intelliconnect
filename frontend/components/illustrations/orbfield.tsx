"use client";

import { cn } from "@/lib/utils";

interface Sparkle {
  top: string;
  left: string;
  delay: string;
  size: string;
}

const SPARKLES: Sparkle[] = [
  { top: "16%", left: "18%", delay: "0s", size: "h-1.5 w-1.5" },
  { top: "28%", left: "72%", delay: "0.8s", size: "h-1 w-1" },
  { top: "58%", left: "12%", delay: "1.6s", size: "h-1 w-1" },
  { top: "72%", left: "60%", delay: "0.4s", size: "h-1.5 w-1.5" },
  { top: "12%", left: "46%", delay: "2.2s", size: "h-1 w-1" },
  { top: "82%", left: "32%", delay: "1.1s", size: "h-1 w-1" },
  { top: "44%", left: "88%", delay: "2s", size: "h-1 w-1" },
  { top: "8%", left: "82%", delay: "0.2s", size: "h-1.5 w-1.5" },
  { top: "64%", left: "84%", delay: "1.8s", size: "h-1 w-1" },
];

interface OrbFieldProps {
  className?: string;
  tones?: string;
}

export function OrbField({ className, tones = "from-[#6366f1]/20 via-[#06b6d4]/15 to-[#8b5cf6]/15" }: OrbFieldProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className={cn("absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-gradient-to-br blur-3xl", tones)}
        style={{ animation: "orb-drift 18s ease-in-out infinite" }}
      />
      <div
        className={cn("absolute top-1/2 right-[6%] h-80 w-80 rounded-full bg-gradient-to-tr blur-3xl", tones)}
        style={{ animation: "orb-drift 22s ease-in-out -6s infinite" }}
      />
      <div
        className={cn("absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-gradient-to-tl blur-3xl", tones)}
        style={{ animation: "orb-drift 20s ease-in-out -12s infinite" }}
      />
      {SPARKLES.map((sparkle, i) => (
        <span
          key={i}
          className={cn("absolute rounded-full bg-[#6366f1] animate-[var(--animate-twinkle)]", sparkle.size)}
          style={{ top: sparkle.top, left: sparkle.left, animationDelay: sparkle.delay }}
        />
      ))}
    </div>
  );
}
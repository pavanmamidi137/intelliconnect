"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const ORBIT_DOTS = [
  { top: "8%", left: "46%", delay: "0s" },
  { top: "40%", left: "86%", delay: "0.8s" },
  { top: "74%", left: "30%", delay: "1.6s" },
  { top: "24%", left: "12%", delay: "2.4s" },
];

export function SecurityShield({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative aspect-square w-full max-w-[320px]", className)}>
      <span className="absolute inset-0 rounded-full border border-success/20 animate-[var(--animate-ring-pulse)]" />
      <span
        className="absolute inset-6 rounded-full border border-success/15 animate-[var(--animate-ring-pulse)]"
        style={{ animationDelay: "0.9s" }}
      />
      <span className="absolute inset-[30%] rounded-full bg-success-soft blur-2xl" />

      {ORBIT_DOTS.map((dot, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-success animate-[var(--animate-pulse-dot)]"
          style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grad-icon-tint absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.5rem]"
      >
        <ShieldCheck className="h-9 w-9 text-success" />
      </motion.div>

      <span
        className="glass-tint absolute right-2 top-1/4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground shadow-[var(--shadow-glass)]"
        style={{ animation: "float-sm 6s ease-in-out infinite" }}
      >
        <Lock className="h-3 w-3 text-success" />
        JWT
      </span>
      <span
        className="glass-tint absolute bottom-2 left-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground shadow-[var(--shadow-glass)]"
        style={{ animation: "float-sm 7s ease-in-out infinite", animationDelay: "1.2s" }}
      >
        <ShieldCheck className="h-3 w-3 text-primary" />
        Private
      </span>
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, FileText, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";

const BARS = [34, 52, 40, 68, 46, 74, 38, 58, 66, 44, 72, 50, 62, 40, 56, 70, 48, 64, 42, 58, 76, 50, 66, 44];

const AVATARS = [
  { initials: "RK", from: "#6366f1", to: "#8b5cf6", delay: "0s" },
  { initials: "AS", from: "#8b5cf6", to: "#06b6d4", delay: "0.7s" },
  { initials: "MN", from: "#06b6d4", to: "#34d399", delay: "1.4s" },
];

const CHIPS = [
  { icon: UploadCloud, label: "Transcript in", tone: "#06b6d4", top: "-7%", right: "6%", delay: "0s" },
  { icon: FileText, label: "Report ✓", tone: "#34d399", top: "82%", right: "-4%", delay: "1s" },
];

export function MeetingScene({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative", className)}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="gradient-border relative overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-3 shadow-[0_40px_90px_-30px_rgba(2,6,23,0.75)]"
      >
        <div className="flex items-center gap-1.5 px-2 pb-2.5 pt-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 truncate rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            app.intelliconnect.app/meetings/q3-planning
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Live meeting</p>
              <h3 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">Q3 Product Planning</h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-[var(--animate-pulse-dot)]" />
              Analyzing
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            {AVATARS.map((avatar) => (
              <span
                key={avatar.initials}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white"
                style={
                  {
                    "--tw-gradient-from": avatar.from,
                    "--tw-gradient-to": avatar.to,
                    animation: "bounce-soft 5s ease-in-out infinite",
                    animationDelay: avatar.delay,
                  } as React.CSSProperties
                }
              >
                {avatar.initials}
              </span>
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground">
              <span className="font-semibold text-primary">3 action items</span> · live
            </span>
          </div>

          <div className="mt-4 flex h-14 items-end justify-between gap-1.5 rounded-xl bg-muted/50 px-3 py-2.5">
            {BARS.map((height, i) => (
              <span
                key={i}
                className="w-full max-w-[10px] rounded-full bg-gradient-to-t from-[#6366f1] to-[#06b6d4]"
                style={{ height: `${height}%`, animation: "pulse-dot 3.4s ease-in-out infinite", animationDelay: `${i * 0.09}s`, opacity: 0.9 }}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Decisions
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                Freeze API v2 scope · Drop staging bot
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" /> Next steps
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                Docs by Fri · Notify all leads
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {CHIPS.map((chip) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="glass-tint absolute z-10 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-[var(--shadow-glass)]"
          style={{ top: chip.top, right: chip.right, animation: "float-sm 7s ease-in-out infinite", animationDelay: chip.delay }}
        >
          <chip.icon className="h-3.5 w-3.5" style={{ color: chip.tone }} />
          <span className="text-foreground">{chip.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
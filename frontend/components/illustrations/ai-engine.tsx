"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Check, ListChecks, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface AIEngineProps {
  className?: string;
}

const CHIPS = [
  { icon: Sparkles, label: "Summary", top: "-6%", left: "-4%", delay: "0s" },
  { icon: ListChecks, label: "Tasks", top: "38%", left: "-9%", delay: "1.2s" },
  { icon: Check, label: "Decisions", top: "72%", left: "-2%", delay: "2s" },
];

const ORBIT_NODES = [
  { top: "6%", left: "44%", delay: "0s" },
  { top: "24%", left: "74%", delay: "0.6s" },
  { top: "56%", left: "82%", delay: "1.2s" },
  { top: "76%", left: "28%", delay: "1.8s" },
  { top: "20%", left: "12%", delay: "2.4s" },
];

export function AIEngine({ className }: AIEngineProps) {
  return (
    <div aria-hidden="true" className={cn("relative mx-auto aspect-square w-full max-w-md", className)}>
      <div className="conic-ring animate-[var(--animate-spin-slow)] absolute inset-[8%] rounded-full opacity-70" />

      {ORBIT_NODES.map((node, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#06b6d4] animate-[var(--animate-pulse-dot)]"
          style={{ top: node.top, left: node.left, animationDelay: node.delay }}
        />
      ))}

      <div className="ring-halo absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grad-icon h-24 w-24 rounded-[1.75rem] shadow-[0_20px_50px_-12px_rgba(99,102,241,0.5)]"
        >
          <span className="absolute inset-0 rounded-[1.75rem] bg-white/20 animate-[var(--animate-glow-pulse)]" />
          <BrainCircuit className="relative h-11 w-11" />
        </motion.div>
      </div>

      {CHIPS.map((chip) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn("glass-tint absolute z-10 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-[var(--shadow-glass)]")}
          style={{ top: chip.top, left: chip.left, animation: "float-sm 6s ease-in-out infinite", animationDelay: chip.delay }}
        >
          <chip.icon className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">{chip.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
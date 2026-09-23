"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border-border px-6 py-16 text-center",
        className
      )}
    >
      <div className="absolute inset-x-16 top-8 h-32 rounded-full bg-gradient-to-br from-primary/15 via-violet/10 to-transparent blur-3xl" aria-hidden="true" />
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-gradient-to-br from-primary/15 to-violet/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
        style={{ animation: "float-sm 6s ease-in-out infinite" }}
      >
        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
      </div>
      <h3 className="relative mt-6 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="relative mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="relative mt-6">{action}</div>}
    </motion.div>
  );
}
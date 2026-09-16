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
        "glass glass-hover relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-dashed border-border px-6 py-16 text-center",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-sky-500/3 to-orange-500/3 opacity-60" aria-hidden="true" />
      <div
        className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-sky-500/15 ring-1 ring-blue-500/20"
        style={{ animation: "float 5s ease-in-out infinite" }}
      >
        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
      </div>
      <h3 className="relative text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="relative mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="relative mt-6">{action}</div>}
    </motion.div>
  );
}
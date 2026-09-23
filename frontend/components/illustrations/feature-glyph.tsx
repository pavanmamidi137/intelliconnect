"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "primary" | "violet" | "success" | "cta";

export const TONE_GRADIENTS: Record<Tone, [string, string, string]> = {
  primary: ["#6366f1", "#8b5cf6", "#06b6d4"],
  violet: ["#8b5cf6", "#06b6d4", "#6366f1"],
  success: ["#34d399", "#06b6d4", "#6366f1"],
  cta: ["#06b6d4", "#8b5cf6", "#6366f1"],
};

const SIZE_BOX = {
  sm: "h-9 w-9 rounded-[0.75rem]",
  md: "h-11 w-11 rounded-[0.8rem]",
  lg: "h-14 w-14 rounded-[0.9rem]",
};

const SIZE_ICON = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

interface FeatureGlyphProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: keyof typeof SIZE_BOX;
  className?: string;
}

export function FeatureGlyph({ icon: Icon, tone = "primary", size = "md", className }: FeatureGlyphProps) {
  const [g1, g2, g3] = TONE_GRADIENTS[tone];

  return (
    <div className="relative inline-flex shrink-0">
      {size === "lg" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${g1}34, transparent 70%)`,
            animation: "ring-pulse 3.2s ease-out infinite",
          }}
        />
      )}
      <motion.div
        whileHover={{ scale: 1.07, rotate: -4 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className={cn("grad-icon", SIZE_BOX[size], className)}
        style={{ "--g1": g1, "--g2": g2, "--g3": g3 } as React.CSSProperties}
      >
        <Icon className={SIZE_ICON[size]} />
      </motion.div>
    </div>
  );
}
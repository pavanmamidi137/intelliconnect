"use client";

import {
  CheckSquare,
  FileText,
  Search,
  Sparkles,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyKind = "meetings" | "people" | "reports" | "tasks" | "search" | "generic";

const SCENES: Record<EmptyKind, { icon: LucideIcon; from: string; via: string; to: string }> = {
  meetings: { icon: Video, from: "#6366f1", via: "#8b5cf6", to: "#06b6d4" },
  people: { icon: Users, from: "#34d399", via: "#06b6d4", to: "#6366f1" },
  reports: { icon: FileText, from: "#06b6d4", via: "#8b5cf6", to: "#6366f1" },
  tasks: { icon: CheckSquare, from: "#8b5cf6", via: "#6366f1", to: "#06b6d4" },
  search: { icon: Search, from: "#6366f1", via: "#06b6d4", to: "#8b5cf6" },
  generic: { icon: Sparkles, from: "#6366f1", via: "#06b6d4", to: "#8b5cf6" },
};

const FLOATIES = [
  { top: "12%", left: "14%", delay: "0s", size: "h-1.5 w-1.5" },
  { top: "20%", left: "72%", delay: "0.9s", size: "h-1 w-1" },
  { top: "70%", left: "20%", delay: "1.7s", size: "h-1 w-1" },
  { top: "78%", left: "68%", delay: "0.5s", size: "h-1.5 w-1.5" },
];

interface EmptySceneProps {
  kind?: EmptyKind;
  className?: string;
}

export function EmptyScene({ kind = "generic", className }: EmptySceneProps) {
  const scene = SCENES[kind] ?? SCENES.generic;
  const Icon = scene.icon;

  return (
    <div aria-hidden="true" className={cn("relative mx-auto h-44 w-44", className)}>
      <div
        className="absolute inset-x-6 top-2 bottom-0 rounded-[2rem] blur-2xl"
        style={{
          background: `linear-gradient(160deg, ${scene.from}40, ${scene.via}2e, ${scene.to}40)`,
          animation: "orb-drift 16s ease-in-out infinite",
        }}
      />
      <div className="glass-tint absolute inset-x-10 top-10 bottom-8 rounded-[2.25rem]" />

      <div
        className="grad-icon-tint absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1rem]"
        style={{ animation: "float-sm 6s ease-in-out infinite" }}
      >
        <Icon className="h-6 w-6" style={{ color: scene.from }} />
      </div>

      <span
        className="absolute right-[18%] top-[14%] h-2 w-12 rounded-full bg-muted"
        style={{ animation: "pulse-dot 3s ease-in-out infinite" }}
      />
      <span
        className="absolute bottom-[16%] left-[12%] h-1.5 w-16 rounded-full bg-muted/70"
        style={{ animation: "pulse-dot 3.6s ease-in-out infinite", animationDelay: "0.8s" }}
      />
      <span
        className="absolute bottom-[10%] right-[16%] h-1 w-10 rounded-full bg-accent"
        style={{ animation: "pulse-dot 3.2s ease-in-out infinite", animationDelay: "1.4s" }}
      />

      {FLOATIES.map((f, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-[var(--animate-twinkle)]"
          style={{ top: f.top, left: f.left, animationDelay: f.delay, background: scene.from }}
        />
      ))}
    </div>
  );
}
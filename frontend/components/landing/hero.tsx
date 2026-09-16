"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  FileText,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const PARTICLES = [
  { left: "8%", top: "22%", size: 6, delay: 0 },
  { left: "16%", top: "68%", size: 4, delay: 1.2 },
  { left: "28%", top: "12%", size: 5, delay: 0.6 },
  { left: "68%", top: "18%", size: 5, delay: 1.6 },
  { left: "82%", top: "46%", size: 7, delay: 0.3 },
  { left: "92%", top: "72%", size: 4, delay: 0.9 },
  { left: "44%", top: "84%", size: 5, delay: 1.9 },
  { left: "58%", top: "8%", size: 4, delay: 2.4 },
];

const FLOAT_STATS = [
  { icon: Zap, label: "Minutes to analyze", value: "< 2" },
  { icon: ShieldCheck, label: "SOC 2-ready", value: "Secure" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* ambient background */}
      <div className="hero-mesh absolute inset-0" aria-hidden="true" />
      <div className="hero-grid absolute inset-0" aria-hidden="true" />

      {/* floating glass orbs */}
      <div
        className="glow-orb left-[8%] top-[16%] h-72 w-72 bg-blue-500/25"
        style={{ animationDelay: "0s" }}
        aria-hidden="true"
      />
      <div
        className="glow-orb right-[6%] top-[24%] h-80 w-80 bg-sky-500/20"
        style={{ animationDelay: "-6s" }}
        aria-hidden="true"
      />
      <div
        className="glow-orb bottom-[6%] left-[42%] h-64 w-64 bg-orange-500/10"
        style={{ animationDelay: "-12s" }}
        aria-hidden="true"
      />

      {/* particle dots */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-primary/40 blur-[1px]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `float ${4 + (i % 3)}s ease-in-out ${p.delay}s infinite`,
          }}
          aria-hidden="true"
        />
      ))}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge
              variant="violet"
              className="animate-[var(--animate-glow-pulse)] mb-6 gap-2 px-4 py-1.5 text-sm shadow-[var(--shadow-glass)]"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI-powered meeting intelligence
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Turn Every{" "}
            <span className="text-gradient-premium">Conversation</span> Into
            Action.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            IntelliConnect transforms meeting transcripts into intelligent summaries,
            actionable tasks, decisions, and professional reports — all in one secure
            platform.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" variant="gradient" className="w-full sm:w-auto">
              <Link href="/register">
                Get Started
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass-surface w-full sm:w-auto">
              <a href="#features">Explore Features</a>
            </Button>
          </motion.div>

          {/* trust stats row */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          >
            {FLOAT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 rounded-full glass-surface px-4 py-1.5 text-sm"
              >
                <stat.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="font-semibold text-foreground">{stat.value}</span>
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              No credit card required · Set up in minutes
            </p>
          </motion.div>
        </motion.div>

        {/* Product preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-5xl sm:mt-20"
        >
          <div
            className="animate-[var(--animate-float-slow)] absolute -inset-6 rounded-3xl bg-gradient-to-r from-blue-500/20 via-sky-500/15 to-orange-500/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="gradient-border glass-strong relative overflow-hidden rounded-2xl shadow-[var(--shadow-glass-hover)]">
            {/* mockup chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-danger/70" />
              <span className="h-3 w-3 rounded-full bg-warning/70" />
              <span className="h-3 w-3 rounded-full bg-success/70" />
              <div className="glass-surface ml-4 hidden items-center gap-2 rounded-md px-3 py-1 text-xs text-muted-foreground sm:flex">
                <Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                IntelliConnect · Meeting Intelligence
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-5">
              {/* summary */}
              <div className="lg:col-span-3">
                <div className="glass-surface shine rounded-xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-primary ring-1 ring-blue-500/20">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Project Alpha Planning</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" /> Aug 5, 2026 · 4 participants
                        </p>
                      </div>
                    </div>
                    <Badge variant="success" className="animate-[var(--animate-glow-pulse)]">
                      Analyzed
                    </Badge>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    The team aligned on the Q3 release scope, finalized the backend API
                    timeline, and agreed on documentation priorities before launch.
                  </p>

                  <div className="mt-4 space-y-2">
                    {["Release scope locked for September", "API documentation prioritized before launch"].map(
                      (point) => (
                        <div key={point} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                          <span className="text-foreground">{point}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* side column: tasks + people + pdf */}
              <div className="space-y-4 lg:col-span-2">
                <div className="glass-surface shine rounded-xl p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">AI Extracted Tasks</p>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: "Ravi Kumar", task: "Prepare API documentation", conf: 94 },
                      { name: "Priya Sharma", task: "Schedule design review", conf: 91 },
                    ].map((item) => (
                      <div key={item.task} className="rounded-lg bg-muted/50 p-2.5">
                        <p className="text-xs font-medium text-foreground">{item.task}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" aria-hidden="true" /> {item.name}
                          </span>
                          <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-semibold text-success">
                            {item.conf}% match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-surface shine flex items-center justify-between rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet ring-1 ring-violet-500/20">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Meeting Report</p>
                      <p className="text-[11px] text-muted-foreground">PDF · ready to download</p>
                    </div>
                  </div>
                  <Badge variant="success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
                    Generated
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
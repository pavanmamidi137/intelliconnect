"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AIEngine } from "@/components/illustrations/ai-engine";
import { MeetingScene } from "@/components/illustrations/meeting-scene";
import { OrbField } from "@/components/illustrations/orbfield";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const FLOAT_STATS = [
  { icon: Zap, value: "< 2 min", label: "to analyze" },
  { icon: ShieldCheck, value: "Secure", label: "by default" },
  { icon: Building2, value: "One org", label: "per workspace" },
];

export function Hero() {
  return (
    <section className="hero-mesh relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <OrbField tones="from-[#6366f1]/[0.22] via-[#06b6d4]/[0.14] to-[#8b5cf6]/[0.16]" />
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="glow-orb left-[8%] top-[14%] h-72 w-72 bg-[#6366f1]/[0.28]"
        style={{ animationDelay: "0s" }}
        aria-hidden="true"
      />
      <div
        className="glow-orb right-[5%] top-[22%] h-80 w-80 bg-[#8b5cf6]/[0.22]"
        style={{ animationDelay: "-6s" }}
        aria-hidden="true"
      />
      <div
        className="glow-orb bottom-[8%] left-[30%] h-64 w-64 bg-[#06b6d4]/[0.14]"
        style={{ animationDelay: "-11s" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div variants={fadeUp}>
            <span className="gradient-border glass-tint inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-primary shadow-[var(--shadow-glass)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-[var(--animate-ring-pulse)]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              AI-powered meeting intelligence
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Turn every{" "}
            <span className="text-shimmer">conversation</span> into action.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            IntelliConnect transforms meeting transcripts into intelligent summaries,
            actionable tasks, decisions, and professional reports — in one beautifully
            secure platform.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full rounded-full shadow-[var(--shadow-glow)] sm:w-auto">
              <Link href="/register">
                Get Started
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full rounded-full sm:w-auto">
              <a href="#features">Explore Features</a>
            </Button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          >
            {FLOAT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="glass-tint flex items-center gap-2 rounded-full px-4 py-1.5 text-sm shadow-[var(--shadow-glass)]"
              >
                <stat.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="font-semibold text-foreground">{stat.value}</span>
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">No credit card required · Set up in minutes</p>
          </motion.div>
        </motion.div>

          <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-4xl sm:mt-20"
        >
          <div
            className="absolute -inset-10 rounded-[3rem] bg-gradient-to-tr from-[#6366f1]/[0.3] via-[#06b6d4]/[0.16] to-[#8b5cf6]/[0.28] blur-3xl animate-[var(--animate-glow-pulse)]"
            aria-hidden="true"
          />
          <div className="conic-ring absolute -top-6 right-4 h-28 w-28 animate-[var(--animate-spin-slow)] opacity-60" aria-hidden="true" />
          <AIEngine className="absolute -right-24 top-1/2 z-0 hidden -translate-y-1/2 scale-125 opacity-25 xl:block" />

          <div className="liquid-glass relative z-10 rounded-[2rem] p-2 sm:p-3">
            <MeetingScene />
          </div>

          <div className="absolute inset-x-0 -bottom-8 h-24 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}
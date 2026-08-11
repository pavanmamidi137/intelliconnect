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
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.08 * i, ease: "easeOut" as const },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* background decoration */}
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/20 to-sky-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <Badge variant="violet" className="mb-6 px-3 py-1 text-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI-powered meeting intelligence
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Turn Every <span className="text-gradient">Conversation</span> Into Action.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            IntelliConnect transforms meeting transcripts into intelligent summaries,
            actionable tasks, decisions, and professional reports — all in one secure
            platform.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" variant="gradient" className="w-full sm:w-auto">
              <Link href="/register">
                Get Started
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <a href="#features">Explore Features</a>
            </Button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-6 text-sm text-muted-foreground"
          >
            No credit card required · Set up in minutes · SOC 2-ready architecture
          </motion.p>
        </div>

        {/* Product preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-5xl sm:mt-20"
        >
          <div
            className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/15 to-sky-500/15 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* mockup chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-danger/70" />
              <span className="h-3 w-3 rounded-full bg-warning/70" />
              <span className="h-3 w-3 rounded-full bg-success/70" />
              <div className="ml-4 hidden items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground sm:flex">
                <Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                IntelliConnect · Meeting Intelligence
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-5">
              {/* summary */}
              <div className="lg:col-span-3">
                <div className="rounded-xl border border-border bg-background p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Project Alpha Planning</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" /> Aug 5, 2026 · 4 participants
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Analyzed</Badge>
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
                <div className="rounded-xl border border-border bg-background p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">AI Extracted Tasks</p>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: "Ravi Kumar", task: "Prepare API documentation", conf: 94 },
                      { name: "Priya Sharma", task: "Schedule design review", conf: 91 },
                    ].map((item) => (
                      <div key={item.task} className="rounded-lg bg-muted/60 p-2.5">
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

                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Meeting Report</p>
                      <p className="text-[11px] text-muted-foreground">PDF · ready to download</p>
                    </div>
                  </div>
                  <Badge variant="success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
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

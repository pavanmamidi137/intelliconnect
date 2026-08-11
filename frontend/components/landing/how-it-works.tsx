"use client";

import { motion } from "framer-motion";
import {
  Building2,
  FileUp,
  Sparkles,
  Users,
} from "lucide-react";

const STEPS = [
  {
    icon: Building2,
    step: "01",
    title: "Create Your Organization",
    description: "Add organization and profile information.",
  },
  {
    icon: Users,
    step: "02",
    title: "Add People",
    description: "Maintain the people connected to your organization.",
  },
  {
    icon: FileUp,
    step: "03",
    title: "Upload Meeting Transcript",
    description: "Upload a transcript or supported meeting document.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Let IntelliConnect Analyze",
    description:
      "AI extracts summary, key points, decisions, people, tasks, deadlines, and context — then you review and generate the final report.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From transcript to actionable intelligence in four simple steps.
          </p>
        </motion.div>

        {/* Desktop horizontal timeline */}
        <div className="relative mt-16 hidden lg:block">
          <div
            className="absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-indigo-500/40"
            aria-hidden="true"
          />
          <div className="grid grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="relative"
              >
                <div className="relative z-10 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/25 bg-background shadow-[var(--shadow-card)]">
                  <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-violet">
                  {step.step}
                </div>
                <h3 className="mt-1.5 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile/tablet vertical timeline */}
        <div className="relative mt-12 space-y-8 lg:hidden">
          <div
            className="absolute bottom-4 left-6 top-4 w-px bg-gradient-to-b from-indigo-500/40 to-violet-500/40"
            aria-hidden="true"
          />
          {STEPS.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.06 * index }}
              className="relative flex gap-5"
            >
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/25 bg-background shadow-[var(--shadow-card)]">
                <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-violet">
                  {step.step}
                </div>
                <h3 className="mt-1 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

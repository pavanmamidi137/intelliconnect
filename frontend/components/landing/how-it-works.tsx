"use client";

import { motion } from "framer-motion";
import { Building2, FileUp, Sparkles, Users } from "lucide-react";

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
    <section id="how-it-works" className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="glow-orb left-[18%] top-[20%] h-72 w-72 bg-violet-500/10"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Workflow
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From transcript to actionable intelligence in four simple steps.
          </p>
        </motion.div>

        {/* Desktop horizontal timeline */}
        <div className="relative mt-16 hidden lg:block">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-6 h-px origin-left bg-gradient-to-r from-blue-500/50 via-sky-500/40 to-blue-500/50"
            aria-hidden="true"
          />
          <div className="grid grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: 0.08 + 0.14 * index, ease: [0.16, 1, 0.3, 1] }}
                className="gradient-border glass glass-hover group relative rounded-2xl p-5"
                whileHover={{ y: -5 }}
              >
                <div className="relative z-10 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/25 bg-background shadow-[var(--shadow-card)] transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-[var(--shadow-glow)]">
                  <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Step {step.step}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile/tablet vertical timeline */}
        <div className="relative mt-12 space-y-6 lg:hidden">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-6 left-6 top-6 w-px origin-top bg-gradient-to-b from-blue-500/50 to-sky-500/50"
            aria-hidden="true"
          />
          {STEPS.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.06 * index, ease: [0.16, 1, 0.3, 1] }}
              className="glass glass-hover relative flex gap-5 rounded-2xl p-4"
            >
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-background shadow-[var(--shadow-card)]">
                <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary">
                  Step {step.step}
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
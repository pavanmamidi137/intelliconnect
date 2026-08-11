"use client";

import { motion } from "framer-motion";
import {
  FileText,
  ListChecks,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Summaries",
    description: "Convert lengthy transcripts into concise, meaningful summaries.",
  },
  {
    icon: ListChecks,
    title: "Smart Task Extraction",
    description: "Automatically identify responsibilities and action items.",
  },
  {
    icon: Network,
    title: "Intelligent Person Matching",
    description: "Resolve duplicate names using organizational context.",
  },
  {
    icon: FileText,
    title: "Professional Reports",
    description: "Generate polished PDF meeting reports automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Storage",
    description: "Keep transcripts, reports, and meeting information securely stored.",
  },
  {
    icon: Users,
    title: "Organization Intelligence",
    description: "Build a structured understanding of your organization's meetings and people.",
  },
];

export function ValueSection() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything Your Meetings Need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One platform that turns unstructured conversations into structured
            organizational knowledge.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: 0.06 * index }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/12 to-violet-500/12 ring-1 ring-indigo-500/15 transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

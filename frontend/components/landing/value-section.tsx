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
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div className="hero-mesh absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <BadgeLabel />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
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
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.06 * index, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="gradient-border glass glass-hover shine group relative rounded-2xl p-6"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-sky-500/15 ring-1 ring-blue-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]">
                <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                {feature.title}
              </h3>
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

function BadgeLabel() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      Features
    </span>
  );
}
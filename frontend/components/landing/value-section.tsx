"use client";

import { motion } from "framer-motion";
import {
  FileText,
  ListChecks,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { FeatureGlyph, TONE_GRADIENTS } from "@/components/illustrations/feature-glyph";

const FEATURES: {
  icon: LucideIcon;
  tone: keyof typeof TONE_GRADIENTS;
  title: string;
  description: string;
}[] = [
  {
    icon: Sparkles,
    tone: "primary",
    title: "AI Summaries",
    description: "Convert lengthy transcripts into concise, meaningful summaries.",
  },
  {
    icon: ListChecks,
    tone: "violet",
    title: "Smart Task Extraction",
    description: "Automatically identify responsibilities and action items.",
  },
  {
    icon: Network,
    tone: "success",
    title: "Intelligent Person Matching",
    description: "Resolve duplicate names using organizational context.",
  },
  {
    icon: FileText,
    tone: "cta",
    title: "Professional Reports",
    description: "Generate polished PDF meeting reports automatically.",
  },
  {
    icon: ShieldCheck,
    tone: "success",
    title: "Secure Storage",
    description: "Keep transcripts, reports, and meeting information securely stored.",
  },
  {
    icon: Users,
    tone: "primary",
    title: "Organization Intelligence",
    description: "Build a structured understanding of your organization's meetings and people.",
  },
];

export function ValueSection() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="glass-tint inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary shadow-[var(--shadow-glass)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your meetings need
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
              className="glass btn-press group relative rounded-3xl p-6"
            >
              <FeatureGlyph icon={feature.icon} tone={feature.tone} size="md" />
              <h3 className="mt-5 text-base font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
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
"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, GitMerge, ShieldAlert } from "lucide-react";

import { AIEngine } from "@/components/illustrations/ai-engine";

const EXTRACTIONS = [
  "Summary",
  "Key points",
  "Decisions",
  "People mentioned",
  "Tasks",
  "Deadlines",
  "Context",
];

export function AISection() {
  return (
    <section id="ai" className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl"
        style={{ animation: "orb-drift 16s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-3xl"
        style={{ animation: "orb-drift 20s ease-in-out -8s infinite" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet">
              <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
              AI Engine
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              AI Intelligence That Understands Your Meetings
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              IntelliConnect reads transcripts with a provider-independent AI engine
              and extracts everything your team needs to act — validated before it
              ever reaches your database.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {EXTRACTIONS.map((item, index) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <AIEngine className="my-4 scale-95 sm:ml-auto sm:mr-4" />

            <div className="gradient-border glass shine rounded-2xl p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1]/15 via-[#8b5cf6]/12 to-[#06b6d4]/15 ring-1 ring-[#6366f1]/25">
                  <BrainCircuit className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="font-semibold text-foreground">Structured JSON, Validated Output</h3>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground shadow-inner">
                <code>{`{
  "summary": "Meeting summary...",
  "key_points": ["Point one", "Point two"],
  "decisions": ["Decision one"],
  "tasks": [{
    "mentioned_name": "Ravi Kumar",
    "task": "Prepare API documentation",
    "deadline": "2026-08-15",
    "context": "Backend API discussion"
  }]
}`}</code></pre>
              <p className="mt-3 text-sm text-muted-foreground">
                The backend never blindly trusts AI output — every response is
                validated against a schema before it is saved.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="gradient-border glass glass-hover rounded-2xl p-5">
                <GitMerge className="mb-2 h-5 w-5 text-violet" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">Context-Aware Person Matching</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Names are never unique identifiers. Duplicate names are resolved
                  with department, designation, and meeting context — with
                  confidence scores.
                </p>
              </div>
              <div className="gradient-border glass glass-hover rounded-2xl p-5">
                <ShieldAlert className="mb-2 h-5 w-5 text-warning" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">Host Confirmation</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Uncertain assignments are never silent — you confirm the right
                  person before anything is final.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
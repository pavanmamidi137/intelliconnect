"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, GitMerge, ShieldAlert } from "lucide-react";

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
        className="pointer-events-none absolute right-0 top-1/4 h-[380px] w-[380px] rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              AI Intelligence That Understands Your Meetings
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              IntelliConnect reads transcripts with a provider-independent AI engine
              and extracts everything your team needs to act — validated before it
              ever reaches your database.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {EXTRACTIONS.map((item, index) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.04 * index }}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">Structured JSON, Validated Output</h3>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted/70 p-4 text-xs leading-relaxed text-muted-foreground">
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
              <div className="rounded-2xl border border-border bg-card p-5">
                <GitMerge className="mb-2 h-5 w-5 text-violet" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">Context-Aware Person Matching</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Names are never unique identifiers. Duplicate names are resolved
                  with department, designation, and meeting context — with
                  confidence scores.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
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

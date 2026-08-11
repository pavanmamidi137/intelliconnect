"use client";

import { motion } from "framer-motion";
import { KeyRound, Lock, ShieldCheck, FileLock2 } from "lucide-react";

const ITEMS = [
  {
    icon: Lock,
    title: "Organization-Level Isolation",
    description: "Every query is scoped to your organization. Your data is never visible to other workspaces.",
  },
  {
    icon: KeyRound,
    title: "JWT Authentication",
    description: "Secure token-based sessions with rotating refresh tokens and hashed passwords.",
  },
  {
    icon: FileLock2,
    title: "Private File Storage",
    description: "Transcripts, audio, and reports live in private storage accessed only through the backend.",
  },
  {
    icon: ShieldCheck,
    title: "Secrets Stay Server-Side",
    description: "AI and storage credentials are environment variables, never exposed to the browser.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Enterprise-Grade Security by Default
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              IntelliConnect is built with production-level security in mind —
              from authentication to file storage to AI provider credentials.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-success/25 bg-success-soft/60 p-4 text-sm text-success">
              <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                No service-role keys, no AI keys, and no internal errors ever reach
                the browser.
              </span>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ITEMS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: 0.07 * index }}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                <item.icon className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

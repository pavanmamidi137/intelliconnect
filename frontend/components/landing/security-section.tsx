"use client";

import { motion } from "framer-motion";
import { KeyRound, Lock, ShieldCheck, FileLock2 } from "lucide-react";

import { SecurityShield } from "@/components/illustrations/security-shield";

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
    <section id="security" className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="glow-orb right-[10%] top-[10%] h-72 w-72 bg-cyan-500/10"
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
            <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-success">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Security
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Enterprise-Grade Security by Default
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              IntelliConnect is built with production-level security in mind —
              from authentication to file storage to AI provider credentials.
            </p>
            <div className="mt-6 flex justify-center sm:justify-start">
              <SecurityShield className="w-56" />
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ITEMS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: 0.07 * index, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5 }}
                className="gradient-border glass glass-hover group rounded-2xl p-5"
              >
                <div className="grad-icon-tint mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
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
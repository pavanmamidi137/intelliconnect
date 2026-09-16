"use client";

import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Landmark,
  Lightbulb,
  Rocket,
  Users,
} from "lucide-react";

const AUDIENCES = [
  { icon: Building2, label: "Companies", detail: "Keep every team accountable" },
  { icon: Rocket, label: "Startups", detail: "Move fast with clear actions" },
  { icon: GraduationCap, label: "Colleges & Universities", detail: "Structured meeting knowledge" },
  { icon: Landmark, label: "Government", detail: "Secure, auditable records" },
  { icon: Users, label: "Non-Profits", detail: "Turn discussions into impact" },
  { icon: Lightbulb, label: "Every team", detail: "Meetings that lead to results" },
];

export function OrganizationsSection() {
  return (
    <section id="organizations" className="relative overflow-hidden py-20 sm:py-28">
      <div className="hero-mesh absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            Audiences
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for Organizations of Every Kind
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every workspace gets its own organization with isolated, secure data.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {AUDIENCES.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="gradient-border glass glass-hover group flex items-center gap-3 rounded-xl px-5 py-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-sky-500/15 ring-1 ring-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                <item.icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
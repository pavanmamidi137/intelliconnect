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
    <section id="organizations" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
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
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.05 * index }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
            >
              <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
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

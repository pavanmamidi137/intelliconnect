"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="gradient-border relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-sky-600 px-6 py-14 text-center shadow-[var(--shadow-glow)] sm:px-16 sm:py-20"
        >
          {/* animated gradient mesh overlay */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "linear-gradient(120deg, rgba(59,130,246,.35), rgba(14,165,233,.2), rgba(234,88,12,.12), rgba(59,130,246,.3))",
              backgroundSize: "300% 300%",
              animation: "gradient-shift 10s ease infinite",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-300/30 blur-3xl"
            style={{ animation: "float 7s ease-in-out infinite" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl"
            style={{ animation: "float 9s ease-in-out 1s infinite" }}
            aria-hidden="true"
          />

          <div className="relative">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-sky-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Start analyzing meetings in minutes
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Turn Every Conversation Into Action
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-sky-100 sm:text-lg">
              AI-powered meeting intelligence for smarter conversations, clearer
              decisions, and accountable execution.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="group bg-white text-blue-700 shadow-[0_10px_30px_-8px_rgba(255,255,255,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="border border-white/30 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
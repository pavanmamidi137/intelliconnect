"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-sky-600 px-6 py-14 text-center shadow-[var(--shadow-glow)] sm:px-16 sm:py-20"
        >
          <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Turn Every Conversation Into Action
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-sky-100 sm:text-lg">
              AI-powered meeting intelligence for smarter conversations, clearer
              decisions, and accountable execution.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-700 shadow-lg hover:bg-blue-50"
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="border border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

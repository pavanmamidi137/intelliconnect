"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, ExternalLink, Lock } from "lucide-react";

import { Card } from "@/components/ui/card";

/**
 * PowerBIContainer
 * ----------------
 * The single, isolated home for the Power BI embedded report.
 *
 * When the embed configuration is provided (`reportId`, `embedUrl`,
 * `accessToken`, `embedType`), this container mounts the Power BI
 * JavaScript client and embeds the report inside `#powerbi-embed-root`.
 * The dashboard page does not need to change when the embed goes live —
 * only this component does.
 *
 * To activate the real embed:
 *   1. `npm i powerbi-client`
 *   2. Uncomment the effect below and call
 *      `powerbi.embed(embedContainer.current, models)` with the embed
 *      configuration passed through props (secured via the backend —
 *      embed tokens must never be fetched client-side).
 *
 * Until then it renders the professional ready-state so the dashboard
 * never looks broken while the analytics are being wired up.
 */

export interface PowerBIEmbedConfig {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  /** "embed" for a live report, "report" for the Power BI service URL. */
  embedType?: "embed" | "report";
  filterPaneEnabled?: boolean;
  navContentPaneEnabled?: boolean;
}

interface PowerBIContainerProps {
  /** Embed configuration. When undefined, the ready-state is rendered. */
  config?: PowerBIEmbedConfig | null;
  title?: string;
  subtitle?: string;
}

export function PowerBIContainer({
  config = null,
  title = "Your Intelligence Dashboard",
  subtitle = "Power BI analytics will appear here.",
}: PowerBIContainerProps) {
  const embedContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config || !embedContainer.current) return;

    // Real embed insertion point (when powerbi-client is installed):
    //
    //   const powerbi = (await import("powerbi-client")).default;
    //   const models = (await import("powerbi-models")).default;
    //   powerbi.embed(embedContainer.current, {
    //     type: config.embedType ?? "embed",
    //     id: config.reportId,
    //     embedUrl: config.embedUrl,
    //     accessToken: config.accessToken,
    //     permissions: models.Permissions.View,
    //     settings: {
    //       filterPaneEnabled: config.filterPaneEnabled ?? true,
    //       navContentPaneEnabled: config.navContentPaneEnabled ?? false,
    //     },
    //   });
    //
    //   return () => powerbi.reset(embedContainer.current);
  }, [config]);

  if (config) {
    return (
      <Card className="overflow-hidden">
        <div ref={embedContainer} className="aspect-[16/9] w-full" aria-label="Embedded Power BI report" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      <Card className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
        <div className="hero-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 ring-1 ring-indigo-500/25">
          <BarChart3 className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="relative mt-5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {subtitle} Once connected, your meeting analytics, task trends, and
          organizational insights will live here.
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 text-success" aria-hidden="true" />
            Secure embed — tokens served by the backend only
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            Powered by Microsoft Power BI
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

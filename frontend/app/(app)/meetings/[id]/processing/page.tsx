"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { meetingsService } from "@/services/meetings";
import { cn, getErrorMessage } from "@/lib/utils";
import type { MeetingStatusInfo } from "@/types";

const STAGES = [
  "Reading transcript",
  "Understanding conversation",
  "Identifying people",
  "Extracting key points",
  "Detecting decisions",
  "Identifying tasks",
  "Matching people",
  "Preparing report",
];

export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [statusInfo, setStatusInfo] = useState<MeetingStatusInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Poll the lightweight status endpoint — the full meeting payload is
    // heavy (task candidates, participant links), so polling it every
    // second would add seconds of needless latency to the screen.
    const poll = async () => {
      try {
        const info = await meetingsService.status(id);
        if (cancelled) return;
        setStatusInfo(info);
        if (info.status === "review_required") {
          toast.success("Meeting analyzed successfully. Review the results below.");
          router.replace(`/meetings/${id}/review`);
          return;
        }
        if (info.status === "completed") {
          router.replace(`/meetings/${id}`);
          return;
        }
        if (info.status === "failed") {
          setFailed(true);
          return;
        }
        timer = setTimeout(poll, 1500);
      } catch {
        if (!cancelled) timer = setTimeout(poll, 2000);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, router]);

  const retry = async () => {
    setRetrying(true);
    try {
      await meetingsService.process(id);
      setFailed(false);
      setStatusInfo(null);
      toast.info("Analysis restarted.");
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't restart the analysis."));
    } finally {
      setRetrying(false);
    }
  };

  const currentStage = statusInfo?.processing_stage ?? 0;
  const doneStage =
    statusInfo?.status === "review_required" || statusInfo?.status === "completed"
      ? STAGES.length
      : currentStage;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[var(--shadow-glow)]"
        >
          {failed ? (
            <AlertTriangle className="h-9 w-9 text-white" aria-hidden="true" />
          ) : (
            <BrainCircuit className="h-9 w-9 text-white" aria-hidden="true" />
          )}
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {failed ? "Analysis couldn't be completed" : "Analyzing your meeting…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {failed
            ? "We couldn't analyze this meeting. Your transcript is safe. Please retry."
            : "IntelliConnect is reading your transcript and extracting intelligence."}
        </p>
      </div>

      {failed ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Your files and meeting data are safe. You can retry the analysis or
              go back to the meeting.
            </p>
            <div className="flex gap-3">
              <Button variant="gradient" onClick={retry} disabled={retrying}>
                {retrying ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                Retry Analysis
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/meetings/${id}`}>Back to Meeting</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <ol className="space-y-1">
              {STAGES.map((stage, index) => {
                const isCurrent = index === currentStage;
                const isDone = index < doneStage;
                return (
                  <li key={stage}>
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
                          isDone
                            ? "border-success bg-success-soft text-success"
                            : isCurrent
                              ? "border-primary bg-accent text-primary"
                              : "border-border text-muted-foreground"
                        )}
                        aria-hidden="true"
                      >
                        {isDone ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          isDone ? "font-medium text-foreground" : isCurrent ? "font-medium text-primary" : "text-muted-foreground"
                        )}
                      >
                        {stage}
                      </span>
                      {isCurrent && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-auto text-xs font-medium text-primary"
                        >
                          In progress
                        </motion.span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {!failed && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Your transcript · This page updates automatically
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

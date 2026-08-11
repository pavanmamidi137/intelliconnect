"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  FileBarChart2,
  ListChecks,
  Plus,
  Users,
  Video,
} from "lucide-react";

import { MeetingStatusBadge } from "@/components/meetings/status-badge";
import { PowerBIContainer } from "@/components/powerbi/power-bi-container";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/services/dashboard";
import type { DashboardStats, MeetingStatus } from "@/types";
import { formatDate, pluralize } from "@/lib/utils";

const STATUS_ORDER: MeetingStatus[] = [
  "completed",
  "review_required",
  "processing",
  "draft",
  "failed",
];

const STATUS_LABELS: Record<MeetingStatus, string> = {
  completed: "Completed",
  review_required: "Review Required",
  processing: "Processing",
  draft: "Draft",
  failed: "Failed",
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 ring-1 ring-indigo-500/20`}>
          <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function HostDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["host-dashboard"],
    queryFn: dashboardService.host,
  });

  const stats: DashboardStats | undefined = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          data?.organization
            ? `${data.organization.name} — your meeting intelligence at a glance.`
            : "Your meeting intelligence at a glance."
        }
        actions={
          data?.ai ? (
            <Badge variant="violet" className="gap-1.5">
              <BrainCircuit className="h-3 w-3" aria-hidden="true" />
              {data.ai.configured
                ? `AI ${data.ai.primary ? `· ${data.ai.primary}` : ""} connected`
                : "AI not configured"}
            </Badge>
          ) : undefined
        }
      />

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {data && stats && stats.total_meetings === 0 && (
        <div className="space-y-6">
          <EmptyState
            icon={Video}
            title="No meetings yet"
            description="Upload your first meeting transcript and let IntelliConnect turn your conversation into actionable intelligence."
            action={
              <Button asChild>
                <Link href="/meetings/new">
                  <Plus aria-hidden="true" />
                  Create Your First Meeting
                </Link>
              </Button>
            }
          />
          <PowerBIContainer />
        </div>
      )}

      {data && stats && stats.total_meetings > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              icon={Video}
              label="Meetings"
              value={stats.total_meetings}
              hint={`${stats.meetings_by_status.review_required} awaiting review`}
            />
            <StatCard
              icon={Users}
              label="People"
              value={stats.people_count}
              hint="Connected to your organization"
            />
            <StatCard
              icon={ListChecks}
              label="Open Tasks"
              value={stats.open_tasks}
              hint={
                stats.tasks_due_soon > 0
                  ? `${stats.tasks_due_soon} due within 7 days`
                  : `${stats.completed_tasks} completed overall`
              }
            />
            <StatCard
              icon={FileBarChart2}
              label="Reports Ready"
              value={stats.reports_count}
              hint={`${stats.decisions_count} decisions captured`}
              accent="text-violet"
            />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Meeting status breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Meetings by Status</CardTitle>
                <CardDescription>Real-time breakdown of every meeting you&apos;ve hosted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {STATUS_ORDER.map((status) => {
                  const count = stats.meetings_by_status[status] ?? 0;
                  const pct = stats.total_meetings > 0 ? Math.round((count / stats.total_meetings) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{STATUS_LABELS[status]}</span>
                        <span className="font-medium tabular-nums text-foreground">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${STATUS_LABELS[status]}: ${count} meetings (${pct}%)`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status === "completed"
                              ? "bg-success"
                              : status === "review_required"
                                ? "bg-warning"
                                : status === "processing"
                                  ? "bg-violet"
                                  : status === "failed"
                                    ? "bg-danger"
                                    : "bg-primary/60"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent meetings */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Recent Meetings</CardTitle>
                  <CardDescription>Your latest meetings and their status.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/meetings">
                    View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recent_meetings.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No meetings recorded yet.
                  </p>
                ) : (
                  data.recent_meetings.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`/meetings/${meeting.id}`}
                      className="flex items-center gap-4 rounded-lg border border-border/70 bg-card/50 p-3.5 transition hover:border-primary/40 hover:bg-accent/40"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15">
                        <Video className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{meeting.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" />
                          {formatDate(meeting.meeting_date)} · {meeting.participants_count}{" "}
                          {pluralize(meeting.participants_count, "participant")}
                        </p>
                      </div>
                      <div className="hidden shrink-0 gap-3 text-right text-xs text-muted-foreground sm:block">
                        <p>{meeting.tasks_count} {pluralize(meeting.tasks_count, "task")}</p>
                        <p>{meeting.decisions_count} {pluralize(meeting.decisions_count, "decision")}</p>
                      </div>
                      <MeetingStatusBadge status={meeting.status} className="shrink-0" />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent open tasks */}
          {data.recent_tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Open action items from your latest meetings.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {data.recent_tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{task.task}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {task.person_name || "Unassigned"}
                        {task.department ? ` · ${task.department}` : ""} —{" "}
                        <Link href={`/meetings/${task.meeting_id}`} className="text-primary hover:underline">
                          {task.meeting_title}
                        </Link>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-foreground">
                        {task.deadline ? `Due ${formatDate(task.deadline)}` : "No deadline"}
                      </p>
                      {task.ai_confidence != null && (
                        <p className="text-xs text-muted-foreground">
                          {Math.round(task.ai_confidence * 100)}% match
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Power BI embedded analytics — the dashboard's intelligence layer. */}
          <PowerBIContainer title="Your Intelligence Dashboard" subtitle="Power BI analytics will appear here." />
        </>
      )}
    </div>
  );
}

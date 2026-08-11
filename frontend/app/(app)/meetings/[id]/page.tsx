"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { MeetingStatusBadge } from "@/components/meetings/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { meetingsService } from "@/services/meetings";
import { formatDate, getErrorMessage, initials } from "@/lib/utils";
import type { TaskStatus } from "@/types";

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startingAnalysis, setStartingAnalysis] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const query = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => meetingsService.get(id),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />;
  }

  if (!query.data) return null;
  const meeting = query.data;

  const startAnalysis = async () => {
    setStartingAnalysis(true);
    try {
      await meetingsService.process(id);
      toast.success("Analysis started.");
      router.push(`/meetings/${id}/processing`);
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't start the analysis."));
    } finally {
      setStartingAnalysis(false);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const { url } = await meetingsService.pdfUrl(id);
      if (url.startsWith("http")) {
        window.open(url, "_blank", "noopener");
      } else {
        const blob = await api.fetchBlob(url);
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${meeting.title.replace(/[^\w-]+/g, "-")}.pdf`;
        link.click();
        URL.revokeObjectURL(objectUrl);
      }
      toast.success("PDF downloaded.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't download the PDF."));
    } finally {
      setDownloading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await meetingsService.remove(id);
      toast.success("Meeting deleted.");
      router.push("/meetings");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't delete this meeting."));
    } finally {
      setDeleting(false);
    }
  };

  const taskStatusVariant: Record<TaskStatus, "success" | "warning" | "secondary"> = {
    completed: "success",
    in_progress: "warning",
    pending: "secondary",
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/meetings")} className="-ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Meetings
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{meeting.title}</h1>
            <MeetingStatusBadge status={meeting.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatDate(meeting.meeting_date)}
            </span>
            <span>Hosted by {meeting.host_name}</span>
            {meeting.transcript_name && (
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {meeting.transcript_name}
              </span>
            )}
            {searchParams.get("report") && (
              <Badge variant="success">
                <FileDown className="h-3 w-3" aria-hidden="true" /> Report generated
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {meeting.status === "draft" && (
            <Button variant="gradient" onClick={startAnalysis} disabled={startingAnalysis}>
              {startingAnalysis ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              Analyze Meeting
            </Button>
          )}
          {meeting.status === "failed" && (
            <Button variant="gradient" onClick={startAnalysis} disabled={startingAnalysis}>
              {startingAnalysis ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              Retry Analysis
            </Button>
          )}
          {meeting.status === "review_required" && (
            <Button variant="gradient" asChild>
              <a href={`/meetings/${id}/review`}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Review Results
              </a>
            </Button>
          )}
          {meeting.has_pdf && (
            <>
              <Button variant="outline" onClick={downloadPdf} disabled={downloading}>
                {downloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                Download PDF
              </Button>
              <Button variant="outline" onClick={async () => {
                try {
                  const { url } = await meetingsService.pdfUrl(id);
                  if (url.startsWith("http")) {
                    window.open(url, "_blank", "noopener");
                  } else {
                    const blob = await api.fetchBlob(url);
                    const objectUrl = URL.createObjectURL(blob);
                    window.open(objectUrl, "_blank", "noopener");
                    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
                  }
                } catch (error) {
                  toast.error(getErrorMessage(error, "We couldn't open the PDF."));
                }
              }}>
                <Eye className="h-4 w-4" aria-hidden="true" /> View PDF
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete meeting" className="text-muted-foreground hover:text-danger">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {meeting.status === "processing" && (
        <div className="flex items-center gap-3 rounded-xl border border-violet/25 bg-violet-soft/60 p-4 text-sm text-violet">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>
            This meeting is being analyzed.{" "}
            <button className="font-semibold underline" onClick={() => router.push(`/meetings/${id}/processing`)}>
              Open the processing screen
            </button>
          </span>
        </div>
      )}

      {meeting.status === "failed" && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft/60 p-4 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>We couldn&apos;t analyze this meeting. Your transcript is safe. Please retry.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet" aria-hidden="true" /> Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meeting.summary ? (
                <>
                  <p className="text-sm font-medium text-foreground">{meeting.summary.summary}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{meeting.summary.paragraph_summary}</p>
                </>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {meeting.status === "draft"
                    ? "This meeting hasn't been analyzed yet."
                    : "No summary available."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Key points + decisions */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Discussion Points</CardTitle>
              </CardHeader>
              <CardContent>
                {meeting.key_points.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No key points yet.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {meeting.key_points.map((point) => (
                      <li key={point.id} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                        <span className="text-foreground">{point.content}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                {meeting.decisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No decisions recorded.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {meeting.decisions.map((decision) => (
                      <li key={decision.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                        {decision.content}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Assigned Tasks
                <span className="text-sm font-normal text-muted-foreground">({meeting.tasks.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks extracted yet.</p>
              ) : (
                <ul className="space-y-3">
                  {meeting.tasks.map((task) => (
                    <li key={task.id} className="rounded-lg border border-border bg-muted/20 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{task.task}</p>
                        <Badge variant={taskStatusVariant[task.status]}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {task.person_name ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <UserRound className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> {task.person_name}
                            {task.department && <span className="font-normal text-muted-foreground">· {task.department}</span>}
                          </span>
                        ) : (
                          <span className="text-warning">{task.mentioned_name || "Unassigned"} — needs confirmation</span>
                        )}
                        {task.deadline && <span>Due {formatDate(task.deadline)}</span>}
                        {task.ai_confidence != null && (
                          <span className="rounded-full bg-success-soft px-1.5 py-0.5 font-semibold text-success">
                            {Math.round(task.ai_confidence * 100)}% match
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" /> Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants added.</p>
              ) : (
                <ul className="space-y-3">
                  {meeting.participants.map((participant) => (
                    <li key={participant.id}>
                      <button
                        type="button"
                        onClick={() => router.push(`/people/${participant.id}`)}
                        className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-muted/50"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">{initials(participant.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{participant.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {participant.department || "No department"}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{meeting.transcript_name || "No transcript"}</span>
                </span>
                {meeting.transcript_name && <Badge variant="success">Stored</Badge>}
              </div>
              {meeting.audio_name && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <span className="truncate">{meeting.audio_name}</span>
                  </span>
                  <Badge variant="success">Stored</Badge>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  Meeting report
                </span>
                {meeting.has_pdf ? (
                  <Badge variant="success">Generated</Badge>
                ) : (
                  <Badge variant="outline">Not yet</Badge>
                )}
              </div>
              <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                Created {formatDate(meeting.created_at)}
              </div>
            </CardContent>
          </Card>

          {meeting.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{meeting.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this meeting?"
        description="The meeting, its analysis, and stored files will be permanently deleted. This action can't be undone."
        confirmLabel="Delete Meeting"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

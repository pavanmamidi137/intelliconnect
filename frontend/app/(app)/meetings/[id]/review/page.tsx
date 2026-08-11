"use client";

/* eslint-disable react-hooks/set-state-in-effect -- intentional one-time
   hydration of editable review state from the fetched payload */
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  ListChecks,
  ListPlus,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ReviewTaskCard } from "@/components/meetings/review-task-card";
import { MeetingStatusBadge } from "@/components/meetings/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { peopleService } from "@/services/people";
import { meetingsService } from "@/services/meetings";
import { getErrorMessage } from "@/lib/utils";
import type { Task } from "@/types";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const reviewQuery = useQuery({
    queryKey: ["meeting-review", id],
    queryFn: () => meetingsService.review(id),
  });

  const peopleQuery = useQuery({
    queryKey: ["people", "all"],
    queryFn: () => peopleService.list({ page_size: 100 }),
  });

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [paragraphSummary, setParagraphSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const meeting = reviewQuery.data;

  // One-time hydration of editable state from the fetched review payload.
  useEffect(() => {
    if (!meeting) return;
    setTitle(meeting.title);
    setSummary(meeting.summary?.summary ?? "");
    setParagraphSummary(meeting.summary?.paragraph_summary ?? "");
    setKeyPoints(meeting.key_points.map((kp) => kp.content));
    setDecisions(meeting.decisions.map((d) => d.content));
    setTasks(meeting.tasks);
  }, [meeting]);

  const people = peopleQuery.data?.results ?? [];

  const unresolvedCount = useMemo(
    () => tasks.filter((t) => t.needs_confirmation).length,
    [tasks]
  );

  const updateTask = (taskId: string, patch: Partial<Task>) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const merged = { ...task, ...patch };
        // Once the host assigns a person, the confirmation flag clears.
        if ("person" in patch && patch.person) {
          merged.needs_confirmation = false;
        }
        return merged;
      })
    );
  };

  const removeTask = (taskId: string) => {
    setTasks((current) => current.filter((t) => t.id !== taskId));
    toast.success("Task removed.");
  };

  const addManualTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    const draft: Task = {
      id: `manual-${Date.now()}`,
      person: null,
      person_name: "",
      department: "",
      designation: "",
      mentioned_name: "",
      task: text,
      deadline: null,
      priority: "medium",
      status: "pending",
      ai_confidence: null,
      context: "",
      source: "manual",
      needs_confirmation: true,
    };
    setTasks((current) => [...current, draft]);
    setNewTaskText("");
    setAddingTask(false);
    toast.success("Task added. Assign a person before generating the report.");
  };

  const confirmAndGenerate = async () => {
    if (!meeting) return;
    setConfirming(true);
    try {
      const payload = {
        title,
        summary,
        paragraph_summary: paragraphSummary,
        key_points: keyPoints.filter((k) => k.trim()),
        decisions: decisions.filter((d) => d.trim()),
        tasks: tasks.map((task) => ({
          id: task.id.startsWith("manual-") ? undefined : task.id,
          person: task.person,
          task: task.task,
          deadline: task.deadline,
          priority: task.priority,
          status: task.status,
          context: task.context,
          mentioned_name: task.mentioned_name,
        })),
      };
      const response = await meetingsService.generateReport(id, payload);
      toast.success("Report generated successfully.");
      router.push(`/meetings/${id}?report=${response.report_id ?? ""}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't generate the report. Please try again."));
    } finally {
      setConfirming(false);
    }
  };

  if (reviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (reviewQuery.isError || !meeting) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {(reviewQuery.error as Error)?.message ?? "This meeting hasn't been analyzed yet."}
        </p>
        <Button variant="outline" onClick={() => router.push(`/meetings/${id}`)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Meeting
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/meetings/${id}`)} className="-ml-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Meeting
        </Button>
        <div className="flex items-center gap-2">
          <MeetingStatusBadge status={meeting.status} />
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet" aria-hidden="true" />
            AI-generated — verify before publishing
          </span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Review & Confirm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the AI results, confirm task owners, then generate the final report.
        </p>
      </div>

      {unresolvedCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft/70 p-4 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>{unresolvedCount}</strong> {unresolvedCount === 1 ? "task needs" : "tasks need"} person
            confirmation. Unassigned tasks will be marked unassigned in the report.
          </span>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="review-title" className="text-sm font-medium text-foreground">
              Meeting Title
            </label>
            <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="review-summary" className="text-sm font-medium text-foreground">
              Short Summary
            </label>
            <Textarea id="review-summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-[70px]" />
          </div>
          <div className="space-y-2">
            <label htmlFor="review-paragraph" className="text-sm font-medium text-foreground">
              Detailed Paragraph Summary
            </label>
            <Textarea
              id="review-paragraph"
              value={paragraphSummary}
              onChange={(e) => setParagraphSummary(e.target.value)}
              className="min-h-[140px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Key points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" /> Key Discussion Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {keyPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary">
                {index + 1}
              </span>
              <Textarea
                value={point}
                onChange={(e) =>
                  setKeyPoints((current) => current.map((p, i) => (i === index ? e.target.value : p)))
                }
                className="min-h-[44px] py-2 text-sm"
                aria-label={`Key point ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="iconSm"
                className="mt-1 text-muted-foreground hover:text-danger"
                onClick={() => setKeyPoints((current) => current.filter((_, i) => i !== index))}
                aria-label="Remove key point"
              >
                <Plus className="h-3.5 w-3.5 rotate-45" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setKeyPoints((current) => [...current, ""])}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Key Point
          </Button>
        </CardContent>
      </Card>

      {/* Decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Decisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {decisions.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No decisions were detected in this meeting.
            </p>
          )}
          {decisions.map((decision, index) => (
            <div key={index} className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <Textarea
                value={decision}
                onChange={(e) =>
                  setDecisions((current) => current.map((d, i) => (i === index ? e.target.value : d)))
                }
                className="min-h-[40px] border-transparent bg-transparent px-0 py-1 text-sm shadow-none focus-visible:border-input"
                aria-label={`Decision ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="iconSm"
                className="text-muted-foreground hover:text-danger"
                onClick={() => setDecisions((current) => current.filter((_, i) => i !== index))}
                aria-label="Remove decision"
              >
                <Plus className="h-3.5 w-3.5 rotate-45" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setDecisions((current) => [...current, ""])}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Decision
          </Button>
        </CardContent>
      </Card>

      {/* People mentioned */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" /> People Mentioned
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meeting.mentions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No people detected in the transcript.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {meeting.mentions.map((mention) => (
                <span
                  key={mention.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm"
                >
                  {mention.person ? (
                    <>
                      <span className="font-medium text-foreground">{mention.person_name}</span>
                      {mention.department && (
                        <span className="text-xs text-muted-foreground">{mention.department}</span>
                      )}
                      {mention.confidence != null && (
                        <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          {Math.round(mention.confidence * 100)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{mention.full_name}</span>
                      <span className="text-xs text-warning">unresolved</span>
                    </>
                  )}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListPlus className="h-4 w-4 text-primary" aria-hidden="true" /> Assigned Tasks
            <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No tasks were extracted. You can add them manually below.
            </p>
          )}
          {tasks.map((task) => (
            <ReviewTaskCard
              key={task.id}
              task={task}
              people={people}
              onUpdate={updateTask}
              onRemove={removeTask}
            />
          ))}

          {addingTask ? (
            <div className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-accent/30 p-4">
              <Textarea
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What needs to be done?"
                aria-label="New task description"
                className="min-h-[70px]"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setAddingTask(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="default" onClick={addManualTask} disabled={!newTaskText.trim()}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add Task
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full border-dashed" onClick={() => setAddingTask(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Task Manually
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Confirm */}
      <div className="sticky bottom-4 z-10">
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur sm:flex-row">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{tasks.length}</strong> tasks ·{" "}
            <strong className="text-foreground">{decisions.filter(Boolean).length}</strong> decisions ·{" "}
            {unresolvedCount > 0 ? (
              <span className="text-warning">{unresolvedCount} awaiting confirmation</span>
            ) : (
              <span className="text-success">all tasks confirmed</span>
            )}
          </p>
          <Button variant="gradient" size="lg" className="w-full sm:w-auto" onClick={confirmAndGenerate} disabled={confirming}>
            {confirming ? <Spinner className="h-4 w-4" /> : <FileDown className="h-4 w-4" aria-hidden="true" />}
            Confirm & Generate Report
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListTodo,
  Mail,
  Pencil,
  UserRound,
  UsersRound,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { PersonFormDialog } from "@/components/people/person-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MeetingStatusBadge } from "@/components/meetings/status-badge";
import { peopleService } from "@/services/people";
import { formatDate, getErrorMessage, initials } from "@/lib/utils";
import type { TaskStatus } from "@/types";

export default function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const query = useQuery({
    queryKey: ["person", id],
    queryFn: () => peopleService.get(id),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />;
  }

  if (!query.data) return null;
  const person = query.data;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await peopleService.remove(person.id);
      toast.success(`${person.full_name} removed.`);
      router.push("/people");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't remove this person."));
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
      <Button variant="ghost" size="sm" onClick={() => router.push("/people")} className="-ml-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to People
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials(person.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{person.full_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {person.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {person.email}
                  </span>
                )}
                {person.user_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> @{person.user_name}
                  </span>
                )}
                {person.department && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> {person.department}
                  </span>
                )}
                {person.designation && <span>{person.designation}</span>}
                {person.teams && (
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound className="h-3.5 w-3.5" aria-hidden="true" /> {person.teams}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <Badge variant={person.is_active ? "success" : "secondary"}>
                  {person.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
              <Video className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{person.meetings_count}</p>
              <p className="text-xs text-muted-foreground">Meetings attended</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-soft text-success">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{person.completed_tasks}</p>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-soft text-warning">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{person.pending_tasks}</p>
              <p className="text-xs text-muted-foreground">Pending tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Meeting history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" aria-hidden="true" /> Meeting History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {person.meeting_history.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No meetings yet. Add this person as a participant to a meeting.
              </p>
            ) : (
              <ul className="space-y-3">
                {person.meeting_history.map((meeting) => (
                  <li key={meeting.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/meetings/${meeting.id}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{meeting.title}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" /> {formatDate(meeting.meeting_date)}
                        </p>
                      </div>
                      <MeetingStatusBadge status={meeting.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Assigned tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" aria-hidden="true" /> Assigned Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {person.assigned_tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No assigned tasks yet. Tasks are matched automatically from meetings.
              </p>
            ) : (
              <ul className="space-y-3">
                {person.assigned_tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/meetings/${task.meeting_id}`)}
                      className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{task.task}</p>
                        <Badge variant={taskStatusVariant[task.status]}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>From: {task.meeting_title}</span>
                        {task.deadline && <span>Due: {formatDate(task.deadline)}</span>}
                        {task.ai_confidence != null && (
                          <span className="text-violet">
                            {Math.round(task.ai_confidence * 100)}% match confidence
                          </span>
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <PersonFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => query.refetch()}
        person={person}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Remove ${person.full_name}?`}
        description="This person will be removed from your organization."
        confirmLabel="Remove Person"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

"use client";

/* eslint-disable react-hooks/set-state-in-effect -- keep the inline edit draft
   in sync with the latest task data */
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Pencil,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { confidenceLabel } from "@/lib/utils";
import type { Person, Task, TaskCandidate } from "@/types";

interface ReviewTaskCardProps {
  task: Task;
  people: Person[];
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onRemove: (id: string) => void;
}

export function ReviewTaskCard({ task, people, onUpdate, onRemove }: ReviewTaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ task: task.task, deadline: task.deadline ?? "" });

  // Keep the inline edit draft in sync with the latest task data.
  useEffect(() => {
    setDraft({ task: task.task, deadline: task.deadline ?? "" });
  }, [task.task, task.deadline]);

  const needsConfirmation = task.needs_confirmation ?? false;

  const candidates = useMemo(() => {
    const unique = new Map<string, TaskCandidate>();
    for (const candidate of task.candidates ?? []) {
      if (!unique.has(candidate.id)) unique.set(candidate.id, candidate);
    }
    return [...unique.values()].sort(
      (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
    );
  }, [task.candidates]);

  const currentPerson = people.find((p) => p.id === task.person);

  const saveEdit = () => {
    onUpdate(task.id, {
      task: draft.task.trim(),
      deadline: draft.deadline || null,
    });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3">
              <Input
                value={draft.task}
                onChange={(e) => setDraft((d) => ({ ...d, task: e.target.value }))}
                aria-label="Task description"
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  <Input
                    type="date"
                    value={draft.deadline}
                    onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
                    className="h-8 w-40 text-xs"
                    aria-label="Deadline"
                  />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} aria-label="Cancel editing">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button size="sm" variant="default" onClick={saveEdit}>
                    <Check className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="font-medium leading-snug text-foreground">{task.task}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {task.deadline && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" aria-hidden="true" /> {task.deadline}
                  </span>
                )}
                {task.context && <span className="italic">“{task.context}”</span>}
                {task.source === "ai" && task.ai_confidence != null && (
                  <Badge variant={task.ai_confidence >= 0.75 ? "success" : "warning"} className="px-1.5 py-0 text-[10px]">
                    {Math.round(task.ai_confidence * 100)}% confidence
                  </Badge>
                )}
                {task.source === "manual" && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Manual</Badge>}
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="iconSm" onClick={() => setEditing((v) => !v)} aria-label="Edit task">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="iconSm"
            className="text-danger hover:bg-danger-soft"
            onClick={() => onRemove(task.id)}
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* confirmation warning */}
      {needsConfirmation && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft/60 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Multiple people may match this task. Please confirm the person.</span>
        </div>
      )}

      {/* assignee */}
      <div className="mt-3 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/15 to-sky-500/15 text-primary">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
        <Select
          value={task.person ?? ""}
          onChange={(e) => {
            const personId = e.target.value;
            onUpdate(task.id, { person: personId || null });
            const person = people.find((p) => p.id === personId);
            if (person) toast.success(`Assigned to ${person.full_name}.`);
          }}
          className="h-9 flex-1 text-sm"
          aria-label="Assign person"
        >
          <option value="">Unassigned — pick a person</option>
          {candidates.length > 0 && (
            <optgroup label="Suggested matches">
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.full_name} — {candidate.department || "No dept."}
                  {candidate.confidence != null ? ` (${Math.round(candidate.confidence * 100)}%)` : ""}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="All people">
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name} — {person.department || "No dept."}
              </option>
            ))}
          </optgroup>
        </Select>
      </div>

      {task.person && currentPerson && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-10 text-xs text-muted-foreground">
          <Badge variant="secondary" className="px-1.5 py-0">
            {currentPerson.department || "No department"}
          </Badge>
          {currentPerson.designation && <span>{currentPerson.designation}</span>}
          {confidenceLabel(task.ai_confidence) !== "Unresolved" && task.ai_confidence != null && (
            <span>
              Match confidence: {confidenceLabel(task.ai_confidence)} ({Math.round(task.ai_confidence * 100)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

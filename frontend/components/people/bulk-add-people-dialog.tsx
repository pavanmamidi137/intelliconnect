"use client";

import { useMemo, useState } from "react";
import { UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { peopleService } from "@/services/people";
import { getErrorMessage, pluralize } from "@/lib/utils";
import type { ImportResult } from "@/types";

interface BulkAddPeopleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

function parseNames(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function BulkAddPeopleDialog({ open, onOpenChange, onAdded }: BulkAddPeopleDialogProps) {
  const [names, setNames] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parsed = useMemo(() => parseNames(names), [names]);

  const submit = async () => {
    const unique = Array.from(new Set(parsed.map((name) => name.toLowerCase()))).length;
    if (unique === 0) return;
    setSubmitting(true);
    try {
      const result = await peopleService.bulkCreate({
        names,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
      });
      setResult(result);
      toast.success(`${result.created} ${pluralize(result.created, "person", "people")} added.`);
      onAdded();
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't add these people. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    if (submitting) return;
    onOpenChange(false);
    setNames("");
    setDepartment("");
    setDesignation("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add People</DialogTitle>
          <DialogDescription>
            Paste people&apos;s names separated by commas or line breaks —
            e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">Ravi Kumar, Sana Verma, Meera</code>.
            Each name is added as a separate person.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="bulk-names">Names</Label>
              <Textarea
                id="bulk-names"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                placeholder={'Ravi Kumar, Sana Verma, Meera\nAnanya Iyer'}
                className="min-h-[120px]"
                aria-describedby="bulk-names-hint"
              />
              <p id="bulk-names-hint" className="text-xs text-muted-foreground">
                {parsed.length === 0
                  ? "Names will be counted as you type."
                  : `${parsed.length} ${pluralize(parsed.length, "person", "people")} recognized.`}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bulk-department">Department (optional)</Label>
                <Input
                  id="bulk-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-designation">Designation (optional)</Label>
                <Input
                  id="bulk-designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <Alert variant="info">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription>
                Blank lines are ignored, and a name pasted twice in the same
                request is added only once. You can still edit each person later
                to add emails, teams, and more.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={submit} disabled={parsed.length === 0 || submitting}>
                {submitting ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                )}
                Add {parsed.length > 0 ? parsed.length : ""}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <Alert variant="success">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>People added</AlertTitle>
              <AlertDescription>
                <strong>{result.created}</strong> {pluralize(result.created, "person", "people")} added,{" "}
                <strong>{result.skipped}</strong> skipped.
              </AlertDescription>
            </Alert>
            {result.skipped_details.length > 0 && (
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                {result.skipped_details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
            <DialogFooter>
              <Button variant="gradient" onClick={close}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
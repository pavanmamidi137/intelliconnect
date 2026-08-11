"use client";

import { useRef, useState } from "react";
import { Download, FileUp, UploadCloud } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { peopleService } from "@/services/people";
import { getErrorMessage } from "@/lib/utils";
import type { ImportResult } from "@/types";

const CSV_TEMPLATE =
  "ID,full_name,user_name,teams,email,department,designation,additional_info\n" +
  ",Sana Verma,sana.v,Design,sana@company.com,Marketing,Manager,Handles brand\n";

interface ImportPeopleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ImportPeopleDialog({ open, onOpenChange, onImported }: ImportPeopleDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selected?: File | null) => {
    setResult(null);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      toast.error("This file type isn't supported. Please upload a CSV file.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("CSV files must be smaller than 5 MB.");
      return;
    }
    setFile(selected);
  };

  const submit = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const result = await peopleService.importCsv(file);
      setResult(result);
      toast.success(`Imported ${result.created} people successfully.`);
      onImported();
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't import this file. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "intelliconnect-people-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const close = () => {
    if (submitting) return;
    onOpenChange(false);
    setFile(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import People</DialogTitle>
          <DialogDescription>
            Bulk-import people from a CSV file with columns{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              ID, full_name, user_name, teams, email, department, designation, additional_info
            </code>
            . Only <strong>full_name</strong> is required, and headers are matched
            case-insensitively (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">Full_Name</code>{" "}
            or <code className="rounded bg-muted px-1 py-0.5 text-xs">FULL NAME</code> both work).
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                dragging ? "border-primary bg-accent/50" : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              {file ? (
                <>
                  <UploadCloud className="h-8 w-8 text-primary" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">Ready to import — click Import to continue</p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
                aria-label="Choose CSV file"
              />
            </button>

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download CSV template
            </button>

            <Alert variant="info">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Duplicate handling</AlertTitle>
              <AlertDescription>
                Rows missing a name are skipped. Duplicate emails within your
                organization are skipped. Duplicate names are imported as separate
                people — each gets a unique ID.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={submit} disabled={!file || submitting}>
                {submitting ? <Spinner className="h-4 w-4" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
                Import {file ? `“${file.name}”` : ""}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <Alert variant="success">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Import complete</AlertTitle>
              <AlertDescription>
                <strong>{result.created}</strong> people imported,{" "}
                <strong>{result.skipped}</strong> rows skipped.
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

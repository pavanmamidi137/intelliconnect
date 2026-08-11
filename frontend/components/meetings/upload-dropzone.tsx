"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, FileUp, Music, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  id: string;
  label: string;
  description: string;
  accept: string;
  maxSizeMB: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onError: (message: string) => void;
}

export function UploadDropzone({
  id,
  label,
  description,
  accept,
  maxSizeMB,
  file,
  onFileChange,
  onError,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    const ext = `.${selected.name.split(".").pop()?.toLowerCase()}`;
    const accepted = accept.split(",").map((a) => a.trim().toLowerCase());
    if (!accepted.includes(ext)) {
      onError(`This file type isn't supported. Supported: ${accept}`);
      return;
    }
    if (selected.size > maxSizeMB * 1024 * 1024) {
      onError(`${label} files must be smaller than ${maxSizeMB} MB.`);
      return;
    }
    onFileChange(selected);
  };

  const Icon = file?.type.startsWith("audio") || /\.(mp3|wav|m4a)$/i.test(file?.name ?? "") ? Music : FileText;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent/40 px-4 py-3.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-sky-500/15 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB · ready to upload
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label={`Remove ${file.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="dropzone"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
              dragging
                ? "border-primary bg-accent/50"
                : "border-border hover:border-primary/50 hover:bg-muted/40"
            )}
          >
            <FileUp className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              Drag & drop your {label.toLowerCase()} here
            </span>
            <span className="text-xs text-muted-foreground">
              or click to browse · {description}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        aria-label={label}
      />
    </div>
  );
}

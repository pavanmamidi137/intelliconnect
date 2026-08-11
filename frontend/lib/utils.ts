import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function confidenceLabel(confidence?: number | null) {
  if (confidence == null) return "Unresolved";
  const pct = Math.round(confidence * 100);
  if (pct >= 90) return "High";
  if (pct >= 75) return "Good";
  if (pct >= 50) return "Fair";
  return "Low";
}

export function confidenceColor(confidence?: number | null) {
  if (confidence == null) return "muted";
  const pct = Math.round(confidence * 100);
  if (pct >= 90) return "success";
  if (pct >= 75) return "primary";
  if (pct >= 50) return "warning";
  return "danger";
}

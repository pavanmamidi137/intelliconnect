export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "IntelliConnect";
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const ORGANIZATION_TYPES = [
  { value: "company", label: "Company" },
  { value: "startup", label: "Startup" },
  { value: "college", label: "College / University" },
  { value: "government", label: "Government" },
  { value: "non_profit", label: "Non-Profit" },
  { value: "other", label: "Other" },
] as const;

export const MEETING_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "one_on_one", label: "One-on-One" },
  { value: "standup", label: "Standup" },
  { value: "brainstorm", label: "Brainstorm" },
  { value: "review", label: "Review" },
  { value: "client_call", label: "Client Call" },
  { value: "other", label: "Other" },
] as const;

export const MEETING_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Processing" },
  { value: "review_required", label: "Review Required" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
] as const;

export const TASK_PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export const TASK_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const;

export const TRANSCRIPT_ACCEPT = ".txt,.pdf,.docx,.srt,.vtt";
export const AUDIO_ACCEPT = ".mp3,.wav,.m4a";

export const MAX_TRANSCRIPT_MB = 20;
export const MAX_AUDIO_MB = 200;

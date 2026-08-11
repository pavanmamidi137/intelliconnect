import { api } from "@/lib/api";
import type {
  MeetingDetail,
  MeetingReviewPayload,
  MeetingStatusInfo,
  MeetingSummaryItem,
  MeetingTranscript,
  Paginated,
  Task,
} from "@/types";

export interface MeetingFilters {
  search?: string;
  status?: string;
  meeting_type?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  page?: number;
}

export interface CreateMeetingPayload {
  title: string;
  meeting_date: string;
  meeting_type: string;
  notes?: string;
  participant_ids?: string[];
  transcript?: File | null;
  /** Paste-in transcript text — stored as a TXT transcript server-side. */
  transcript_text?: string;
  audio?: File | null;
}

export interface ReviewEdit {
  title?: string;
  meeting_date?: string;
  notes?: string;
  summary?: string;
  paragraph_summary?: string;
  key_points?: string[];
  decisions?: string[];
  tasks?: Partial<Task>[];
}

export const meetingsService = {
  async list(filters: MeetingFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.meeting_type) params.set("meeting_type", filters.meeting_type);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.page && filters.page > 1) params.set("page", String(filters.page));
    const qs = params.toString();
    return api.get<Paginated<MeetingSummaryItem>>(`/meetings/${qs ? `?${qs}` : ""}`);
  },

  async get(id: string) {
    return api.get<MeetingDetail>(`/meetings/${id}/`);
  },

  async create(payload: CreateMeetingPayload, onProgress?: (percent: number) => void) {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("meeting_date", payload.meeting_date);
    form.append("meeting_type", payload.meeting_type);
    if (payload.notes) form.append("notes", payload.notes);
    if (payload.participant_ids?.length) {
      form.append("participant_ids", JSON.stringify(payload.participant_ids));
    }
    if (payload.transcript) form.append("transcript", payload.transcript);
    if (payload.transcript_text) form.append("transcript_text", payload.transcript_text);
    if (payload.audio) form.append("audio", payload.audio);
    return api.uploadWithProgress<MeetingDetail>("/meetings/", form, onProgress);
  },

  async update(id: string, payload: Partial<Pick<MeetingDetail, "title" | "meeting_date" | "meeting_type" | "notes">>) {
    return api.patch<MeetingDetail>(`/meetings/${id}/`, payload);
  },

  async remove(id: string) {
    return api.delete<void>(`/meetings/${id}/`);
  },

  async process(id: string) {
    return api.post<{ detail: string; status: string }>(`/meetings/${id}/process/`);
  },

  /** Cheap status + pipeline stage — used by the processing screen poll. */
  async status(id: string) {
    return api.get<MeetingStatusInfo>(`/meetings/${id}/status/`);
  },

  async review(id: string) {
    return api.get<MeetingReviewPayload>(`/meetings/${id}/review/`);
  },

  async generateReport(id: string, edits: ReviewEdit) {
    return api.post<{
      detail: string;
      report_id?: string;
      meeting?: MeetingDetail;
    }>(`/meetings/${id}/generate-report/`, edits);
  },

  async pdfUrl(id: string) {
    return api.get<{ url: string; filename: string }>(`/meetings/${id}/pdf/`);
  },

  /** Transcript text split into speaker turns, matched against people. */
  async transcript(id: string) {
    return api.get<MeetingTranscript>(`/meetings/${id}/transcript/`);
  },
};

export const tasksService = {
  async create(payload: Partial<Task> & { meeting: string }) {
    return api.post<Task>("/tasks/", payload);
  },
  async update(id: string, payload: Partial<Task>) {
    return api.patch<Task>(`/tasks/${id}/`, payload);
  },
  async remove(id: string) {
    return api.delete<void>(`/tasks/${id}/`);
  },
};

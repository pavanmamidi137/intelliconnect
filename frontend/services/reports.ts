import { api } from "@/lib/api";
import type { MeetingReport, Paginated } from "@/types";

export const reportsService = {
  async list(page = 1) {
    return api.get<Paginated<MeetingReport>>(`/reports/?page=${page}`);
  },

  async get(id: string) {
    return api.get<MeetingReport>(`/reports/${id}/`);
  },

  async downloadUrl(id: string) {
    return api.get<{ url: string; filename: string }>(`/reports/${id}/download/`);
  },
};

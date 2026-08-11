import { api } from "@/lib/api";
import type { Paginated, Person, PersonDetail } from "@/types";

export interface PersonFilters {
  search?: string;
  department?: string;
  designation?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export const peopleService = {
  async list(filters: PersonFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.department) params.set("department", filters.department);
    if (filters.designation) params.set("designation", filters.designation);
    if (filters.status) params.set("status", filters.status);
    if (filters.page && filters.page > 1) params.set("page", String(filters.page));
    if (filters.page_size) params.set("page_size", String(filters.page_size));
    const qs = params.toString();
    return api.get<Paginated<Person>>(`/people/${qs ? `?${qs}` : ""}`);
  },

  async get(id: string) {
    return api.get<PersonDetail>(`/people/${id}/`);
  },

  async create(payload: Partial<Person>) {
    return api.post<Person>("/people/", payload);
  },

  async update(id: string, payload: Partial<Person>) {
    return api.patch<Person>(`/people/${id}/`, payload);
  },

  async remove(id: string) {
    return api.delete<void>(`/people/${id}/`);
  },

  async importCsv(file: File) {
    const form = new FormData();
    form.append("file", file);
    return api.post<import("@/types").ImportResult>("/people/import/", form);
  },

  async facets() {
    return api.get<{ departments: string[]; designations: string[] }>("/people/facets/");
  },
};

import { api } from "@/lib/api";
import type { Organization } from "@/types";

export const organizationService = {
  async get() {
    return api.get<Organization>("/organization/");
  },

  async update(payload: Partial<Organization>) {
    return api.patch<Organization>("/organization/", payload);
  },
};

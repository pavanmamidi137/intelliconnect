import { api } from "@/lib/api";
import type { SiteTheme } from "@/types";

/** Platform branding API — GET is public, PUT requires the super-admin role. */
export const themeService = {
  async get() {
    return api.get<SiteTheme>("/settings/theme/");
  },

  async update(payload: Partial<SiteTheme>) {
    return api.put<SiteTheme>("/settings/theme/", payload);
  },

  async reset() {
    return api.post<SiteTheme>("/settings/theme/reset/");
  },
};

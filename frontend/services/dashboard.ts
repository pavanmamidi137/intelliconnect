import { api } from "@/lib/api";
import type {
  AdminDashboard,
  AdminOrganization,
  AdminUser,
  HostDashboard,
  Paginated,
} from "@/types";

export const dashboardService = {
  /** Host dashboard — scoped to the signed-in host's own organization. */
  host: () => api.get<HostDashboard>("/dashboard/"),

  /** Platform-wide app-management dashboard (admin role only). */
  admin: () => api.get<AdminDashboard>("/dashboard/admin/"),

  adminOrganizations: (params: { page?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<Paginated<AdminOrganization>>(
      `/dashboard/admin/organizations/${qs ? `?${qs}` : ""}`
    );
  },

  adminUsers: (params: { page?: number; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<Paginated<AdminUser>>(
      `/dashboard/admin/users/${qs ? `?${qs}` : ""}`
    );
  },
};

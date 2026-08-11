import { api } from "@/lib/api";
import type { AuthResponse, User } from "@/types";

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  organization_name: string;
  organization_type: string;
  designation: string;
  department: string;
}

export const authService = {
  async register(payload: RegisterPayload) {
    return api.post<AuthResponse>("/auth/register/", payload);
  },

  async login(email: string, password: string) {
    return api.post<AuthResponse>("/auth/login/", { email, password });
  },

  async logout(refresh: string | null) {
    try {
      await api.post("/auth/logout/", { refresh });
    } finally {
      api.clearTokens();
    }
  },

  async me() {
    return api.get<User>("/auth/me/");
  },

  async updateProfile(payload: Partial<Pick<User, "full_name" | "designation" | "department">>) {
    return api.patch<User>("/profile/", payload);
  },

  async changePassword(current_password: string, new_password: string) {
    return api.post<{ message: string }>("/profile/password/", {
      current_password,
      new_password,
    });
  },

  async aiProviderStatus() {
    return api.get<import("@/types").AIProviderStatus>("/auth/ai-providers/");
  },
};

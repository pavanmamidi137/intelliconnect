"use client";

/* eslint-disable react-hooks/set-state-in-effect -- hydrating the session user
   on mount is the canonical authentication pattern */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/lib/api";
import { authService } from "@/services/auth";
import type { RegisterPayload } from "@/services/auth";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithOtp: (email: string, code: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_CACHE_KEY = "intelliconnect.user_profile";

function readUserCache(): User | null {
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    return parsed && typeof parsed.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeUserCache(user: User) {
  try {
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Non-fatal — the session still works, just without the fast restore.
  }
}

function clearUserCache() {
  try {
    window.localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Ignore.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Seed from the cached profile so a returning visitor sees the app shell
  // instantly — no blank splash while /me round-trips. The background
  // hydrate below validates and refreshes it.
  const [user, setUser] = useState<User | null>(() =>
    typeof window !== "undefined" && api.isAuthenticated ? readUserCache() : null
  );
  const [loading, setLoading] = useState(
    () => !(typeof window !== "undefined" && api.isAuthenticated && readUserCache())
  );

  const hydrate = useCallback(async () => {
    if (!api.isAuthenticated) {
      clearUserCache();
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authService.me();
      setUser(me);
      writeUserCache(me);
    } catch {
      api.clearTokens();
      clearUserCache();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate the authenticated user once on mount (canonical auth pattern).
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    api.setTokens(response.access, response.refresh);
    writeUserCache(response.user);
    setUser(response.user);
    return response.user;
  }, []);

  const loginWithOtp = useCallback(async (email: string, code: string) => {
    const response = await authService.verifyOtp(email, code);
    api.setTokens(response.access, response.refresh);
    writeUserCache(response.user);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    api.setTokens(response.access, response.refresh);
    writeUserCache(response.user);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = typeof window !== "undefined"
      ? window.localStorage.getItem("intelliconnect.refresh_token")
      : null;
    await authService.logout(refresh);
    clearUserCache();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
    } catch {
      // Keep current user on transient failures.
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      // "admin" is accepted as a legacy alias for accounts created before
      // the superadmin role existed.
      isAdmin: user?.role === "superadmin" || user?.role === "admin",
      login,
      loginWithOtp,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, loginWithOtp, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

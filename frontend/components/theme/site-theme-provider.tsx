"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { applySiteTheme } from "@/lib/theme-utils";
import { themeService } from "@/services/theme";
import { DEFAULT_SITE_THEME, type SiteTheme } from "@/types";

const CACHE_KEY = "intelliconnect.site_theme";

interface SiteThemeContextValue {
  /** The active platform theme (defaults + super-admin branding). */
  theme: SiteTheme;
  loading: boolean;
  /**
   * Apply a theme to the UI immediately and — when `persist` is true —
   * save it through the API as the platform theme (super-admin only).
   */
  apply: (next: SiteTheme, options?: { persist?: boolean }) => Promise<void>;
  /** Revert to the built-in default design system. */
  reset: () => Promise<void>;
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);

function readCache(): SiteTheme | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_SITE_THEME, ...(JSON.parse(raw) as Partial<SiteTheme>) };
  } catch {
    return null;
  }
}

function writeCache(theme: SiteTheme) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(theme));
  } catch {
    // Storage unavailable — the theme still applies for this session.
  }
}

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  // Seed from cache during hydration so the very first paint already has
  // the platform branding (no flash of the default palette).
  const [theme, setTheme] = useState<SiteTheme>(() => readCache() ?? DEFAULT_SITE_THEME);
  const [loading, setLoading] = useState(true);

  // Apply the cached theme before the first paint.
  useLayoutEffect(() => {
    applySiteTheme(theme);
  }, [theme]);

  // Refresh from the backend in the background — GET is public, so this
  // works before login. Failures keep the cached/default theme.
  useEffect(() => {
    let cancelled = false;
    themeService
      .get()
      .then((remote) => {
        if (cancelled) return;
        setTheme(remote);
        writeCache(remote);
      })
      .catch(() => {
        // Offline / API down — keep whatever is applied.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const apply = useCallback(async (next: SiteTheme, options?: { persist?: boolean }) => {
    setTheme(next);
    writeCache(next);
    if (options?.persist) {
      const saved = await themeService.update(next);
      setTheme(saved);
      writeCache(saved);
    }
  }, []);

  const reset = useCallback(async () => {
    const saved = await themeService.reset();
    setTheme(saved);
    writeCache(saved);
  }, []);

  const value = useMemo(
    () => ({ theme, loading, apply, reset }),
    [theme, loading, apply, reset]
  );

  return <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>;
}

export function useSiteTheme() {
  const context = useContext(SiteThemeContext);
  if (!context) {
    throw new Error("useSiteTheme must be used within a SiteThemeProvider");
  }
  return context;
}

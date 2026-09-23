"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: string;
  resolvedTheme: "light" | "dark";
  setTheme: React.Dispatch<React.SetStateAction<string>>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  /* eslint-disable react-hooks/set-state-in-effect -- restore persisted UI preference after hydration */
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const resolved = theme === "system" ? systemTheme() : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.classList.toggle("light", resolved === "light");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: (theme === "dark" ? "dark" : "light") as "light" | "dark",
      setTheme: setTheme as React.Dispatch<React.SetStateAction<string>>,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
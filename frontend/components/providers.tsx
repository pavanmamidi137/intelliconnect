"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

import { AuthProvider } from "@/hooks/use-auth";
import { SiteThemeProvider } from "@/components/theme/site-theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SiteThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </SiteThemeProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { borderRadius: "0.75rem" },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

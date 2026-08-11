"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 lg:block">
        <div className="space-y-4 p-4">
          <Skeleton className="h-9 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex h-16 items-center gap-4 border-b border-border px-6">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="ml-auto h-9 w-9 rounded-full" />
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // Role-based dashboard separation: hosts land on /dashboard, platform
    // admins on /admin. Cross-role access is redirected back to home.
    if (isAdmin && pathname === "/dashboard") {
      router.replace("/admin");
    } else if (!isAdmin && pathname.startsWith("/admin")) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, isAdmin, pathname, router]);

  if (loading) {
    return <ShellSkeleton />;
  }

  if (!isAuthenticated || (isAdmin && pathname === "/dashboard") || (!isAdmin && pathname.startsWith("/admin"))) {
    return null; // redirecting
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar mobile open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onMenuClick={() => setMobileNavOpen(true)} />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}

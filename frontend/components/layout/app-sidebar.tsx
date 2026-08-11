"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  Settings,
  Users,
  Video,
  X,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const HOST_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meetings", href: "/meetings", icon: Video },
  { label: "People", href: "/people", icon: Users },
  { label: "Organization", href: "/organization", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { label: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ mobile = false, open = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : HOST_NAV_ITEMS;
  const homeHref = isAdmin ? "/admin" : "/dashboard";

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link href={homeHref} onClick={onClose} aria-label="IntelliConnect dashboard">
          <Logo />
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId={mobile ? "mobile-active-pill" : "desktop-active-pill"}
                  className="absolute inset-0 rounded-lg bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  aria-hidden="true"
                />
              )}
              <item.icon
                className={cn(
                  "relative z-10 h-4.5 w-4.5",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );

  if (mobile) {
    return (
      <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-background shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
          role={open ? "dialog" : undefined}
          aria-modal={open ? "true" : undefined}
          aria-label={open ? "Navigation menu" : undefined}
          aria-hidden={!open}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 lg:block">
      <div className="sticky top-0 h-screen">{content}</div>
    </aside>
  );
}

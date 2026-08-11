"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/lib/utils";

interface AppTopbarProps {
  onMenuClick: () => void;
}

export function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/meetings?search=${encodeURIComponent(q)}`);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully.");
    router.push("/login");
  };

  const orgName = useMemo(
    () => (isAdmin ? "Platform Admin" : user?.organization?.name ?? "Your workspace"),
    [isAdmin, user]
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {!isAdmin && (
        <form onSubmit={handleSearch} className="relative hidden flex-1 sm:block sm:max-w-md" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meetings…"
          aria-label="Search meetings"
          className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        </form>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground" aria-label="Notifications">
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" aria-hidden="true" />
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open profile menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(user?.full_name)}</AvatarFallback>
              </Avatar>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{user?.full_name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
                <span className="mt-1 truncate text-xs font-normal text-muted-foreground">{orgName}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(isAdmin ? "/admin" : "/dashboard")}>
              <LayoutDashboard /> Dashboard
            </DropdownMenuItem>
            {!isAdmin && (
              <DropdownMenuItem onClick={() => router.push("/people")}>
                <UserRound /> My Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger">
              <LogOut /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

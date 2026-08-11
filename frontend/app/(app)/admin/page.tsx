"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileBarChart2,
  ListChecks,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Video,
} from "lucide-react";

import { MeetingStatusBadge } from "@/components/meetings/status-badge";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import { formatDate, pluralize } from "@/lib/utils";
import { dashboardService } from "@/services/dashboard";
import type {
  AdminDashboard,
  AdminOrganization,
  AdminUser,
  MeetingStatus,
  TaskStatus,
} from "@/types";

const MEETING_STATUS_ORDER: MeetingStatus[] = [
  "completed",
  "review_required",
  "processing",
  "draft",
  "failed",
];

const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  completed: "Completed",
  review_required: "Review Required",
  processing: "Processing",
  draft: "Draft",
  failed: "Failed",
};

const TASK_STATUS_ORDER: TaskStatus[] = ["pending", "in_progress", "completed"];
const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

function orgTypeLabel(value: string) {
  return ORGANIZATION_TYPES.find((t) => t.value === value)?.label ?? value;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 ring-1 ring-indigo-500/20">
          <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBar({
  label,
  count,
  total,
  className,
}: {
  label: string;
  count: number;
  total: number;
  className: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${label}: ${count} (${pct}%)`}>
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  count,
  onPage,
}: {
  page: number;
  totalPages: number;
  count: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {count} {pluralize(count, "result")} · page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: AdminDashboard }) {
  const { stats } = data;
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <StatCard icon={Building2} label="Organizations" value={stats.organizations} />
        <StatCard icon={UserRound} label="Users" value={stats.users} />
        <StatCard icon={Users} label="People" value={stats.people} />
        <StatCard icon={Video} label="Meetings" value={stats.meetings} accent="text-violet" />
        <StatCard icon={ListChecks} label="Tasks" value={stats.tasks} accent="text-violet" />
        <StatCard icon={FileBarChart2} label="Reports" value={`${stats.reports_ready} / ${stats.reports}`} accent="text-violet" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Meetings by Status</CardTitle>
            <CardDescription>Across all organizations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MEETING_STATUS_ORDER.map((status) => (
              <StatusBar
                key={status}
                label={MEETING_STATUS_LABELS[status]}
                count={stats.meetings_by_status[status] ?? 0}
                total={stats.meetings}
                className={
                  status === "completed"
                    ? "bg-success"
                    : status === "review_required"
                      ? "bg-warning"
                      : status === "processing"
                        ? "bg-violet"
                        : status === "failed"
                          ? "bg-danger"
                          : "bg-primary/60"
                }
              />
            ))}
            <p className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              {stats.transcripts_stored} transcripts · {stats.pdfs_generated} PDFs stored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Every extracted action item.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {TASK_STATUS_ORDER.map((status) => (
              <StatusBar
                key={status}
                label={TASK_STATUS_LABELS[status]}
                count={stats.tasks_by_status[status] ?? 0}
                total={stats.tasks}
                className={
                  status === "completed"
                    ? "bg-success"
                    : status === "in_progress"
                      ? "bg-violet"
                      : "bg-warning"
                }
              />
            ))}
            <p className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              {stats.decisions} decisions captured platform-wide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Providers</CardTitle>
            <CardDescription>Server-side configuration — keys never exposed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.providers.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{provider.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{provider.model}</p>
                </div>
                <Badge
                  variant={provider.configured ? "success" : "secondary"}
                  className="shrink-0"
                >
                  {provider.configured ? "Connected" : "Not configured"}
                </Badge>
              </div>
            ))}
            {data.primary && (
              <p className="pt-1 text-xs text-muted-foreground">
                Active provider: <span className="font-medium capitalize text-foreground">{data.primary}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Organizations</CardTitle>
            <CardDescription>Newest workspaces on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_organizations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No organizations yet.</p>
            ) : (
              data.recent_organizations.map((org) => (
                <div key={org.id} className="flex items-center gap-4 rounded-lg border border-border/70 p-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15">
                    <Building2 className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{org.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {orgTypeLabel(org.organization_type)} · created {formatDate(org.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {org.members_count} {pluralize(org.members_count, "member")} · {org.meetings_count}{" "}
                    {pluralize(org.meetings_count, "meeting")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
            <CardDescription>Latest activity across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_meetings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No meetings yet.</p>
            ) : (
              data.recent_meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-4 rounded-lg border border-border/70 p-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15">
                    <Video className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{meeting.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meeting.host_name} · {formatDate(meeting.meeting_date)}
                    </p>
                  </div>
                  <MeetingStatusBadge status={meeting.status} className="shrink-0" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrganizationsTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const query = useQuery({
    queryKey: ["admin-organizations", page, debouncedSearch],
    queryFn: () => dashboardService.adminOrganizations({ page, search: debouncedSearch }),
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search organizations…"
          aria-label="Search organizations"
          className="pl-9"
        />
      </div>

      <Card>
        {query.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={query.error instanceof Error ? query.error.message : undefined}
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>People</TableHead>
                  <TableHead>Meetings</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Open Tasks</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  query.data?.results.map((org: AdminOrganization) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-foreground">{org.name}</TableCell>
                      <TableCell className="text-muted-foreground">{orgTypeLabel(org.organization_type)}</TableCell>
                      <TableCell className="tabular-nums">{org.members_count}</TableCell>
                      <TableCell className="tabular-nums">{org.people_count}</TableCell>
                      <TableCell className="tabular-nums">{org.meetings_count}</TableCell>
                      <TableCell className="tabular-nums">{org.completed_meetings}</TableCell>
                      <TableCell className="tabular-nums">{org.open_tasks}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(org.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              page={query.data?.page ?? 1}
              totalPages={query.data?.total_pages ?? 1}
              count={query.data?.count ?? 0}
              onPage={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const query = useQuery({
    queryKey: ["admin-users", page, debouncedSearch],
    queryFn: () => dashboardService.adminUsers({ page, search: debouncedSearch }),
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search users by name or email…"
          aria-label="Search users"
          className="pl-9"
        />
      </div>

      <Card>
        {query.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={query.error instanceof Error ? query.error.message : undefined}
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  query.data?.results.map((user: AdminUser) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-foreground">{user.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "violet" : "secondary"}>
                          {user.role === "admin" ? "Admin" : "Host"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.organization?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.department || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "success" : "danger"}>
                          {user.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              page={query.data?.page ?? 1}
              totalPages={query.data?.total_pages ?? 1}
              count={query.data?.count ?? 0}
              onPage={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: dashboardService.admin,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Management"
        description="Platform-wide overview of organizations, users, meetings, and AI."
        actions={
          <Badge variant="violet" className="gap-1.5">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Platform Admin
          </Badge>
        }
      />

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab data={data} />
          </TabsContent>
          <TabsContent value="organizations">
            <OrganizationsTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

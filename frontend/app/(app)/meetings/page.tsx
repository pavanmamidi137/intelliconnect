"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
  List,
  ListChecks,
  Plus,
  Search,
  Users,
  Video,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MeetingStatusBadge } from "@/components/meetings/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { MEETING_STATUSES, MEETING_TYPES } from "@/lib/constants";
import { meetingsService } from "@/services/meetings";
import { formatDate, initials, pluralize } from "@/lib/utils";
import type { MeetingSummaryItem } from "@/types";

export default function MeetingsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [sort, setSort] = useState("-meeting_date");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status || undefined,
      meeting_type: meetingType || undefined,
      sort,
      page,
    }),
    [debouncedSearch, status, meetingType, sort, page]
  );

  const query = useQuery({
    queryKey: ["meetings", filters],
    queryFn: () => meetingsService.list(filters),
  });

  const data = query.data;
  const meetings = data?.results ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Upload transcripts, let AI analyze them, and generate professional reports."
        actions={
          <Button asChild variant="gradient">
            <Link href="/meetings/new">
              <Plus aria-hidden="true" /> New Meeting
            </Link>
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Search meetings"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {MEETING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <Select
            value={meetingType}
            onChange={(e) => {
              setMeetingType(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by meeting type"
          >
            <option value="">All types</option>
            {MEETING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort meetings">
            <option value="-meeting_date">Newest date</option>
            <option value="meeting_date">Oldest date</option>
            <option value="-created_at">Recently added</option>
            <option value="title">Title A–Z</option>
            <option value="status">Status</option>
          </Select>
          <div className="ml-auto flex rounded-lg border border-border bg-muted/40 p-0.5" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex h-8 w-9 items-center justify-center rounded-md transition-colors",
                view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Card view"
              aria-pressed={view === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "inline-flex h-8 w-9 items-center justify-center rounded-md transition-colors",
                view === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Table view"
              aria-pressed={view === "table"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {query.isError && (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      )}

      {query.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!query.isLoading && !query.isError && data && data.count === 0 && (
        <EmptyState
          icon={Video}
          title="No meetings yet"
          description="Upload your first meeting transcript and let IntelliConnect turn your conversation into actionable intelligence."
          action={
            <Button asChild variant="gradient">
              <Link href="/meetings/new">
                <Plus aria-hidden="true" /> Create Your First Meeting
              </Link>
            </Button>
          }
        />
      )}

      {!query.isLoading && !query.isError && data && data.count > 0 && (
        <>
          {view === "grid" ? (
            <MeetingGrid meetings={meetings} />
          ) : (
            <MeetingTable meetings={meetings} />
          )}

          {data.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {data.count} {pluralize(data.count, "meeting")}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {data.page} of {data.total_pages}</span>
                <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MeetingGrid({ meetings }: { meetings: MeetingSummaryItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting, index) => (
        <Link
          key={meeting.id}
          href={`/meetings/${meeting.id}`}
          className="group animate-[var(--animate-slide-up)] rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)]"
          style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-snug text-foreground line-clamp-2">{meeting.title}</h3>
            <MeetingStatusBadge status={meeting.status} />
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(meeting.meeting_date)}
          </p>

          {/* participants */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {(meeting.participants ?? []).slice(0, 4).map((participant) => (
                <Avatar key={participant.id} className="h-7 w-7 ring-2 ring-card">
                  <AvatarFallback className="text-[9px]">{initials(participant.full_name)}</AvatarFallback>
                </Avatar>
              ))}
              {meeting.participants_count > 4 && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
                  +{meeting.participants_count - 4}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {meeting.participants_count} {pluralize(meeting.participants_count, "participant")}
            </span>
          </div>

          {/* meta */}
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" aria-hidden="true" /> {meeting.tasks_count} tasks
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> {meeting.decisions_count} decisions
            </span>
            {meeting.has_pdf && (
              <Badge variant="success" className="ml-auto px-1.5 py-0 text-[10px]">
                <FileText className="h-3 w-3" aria-hidden="true" /> PDF
              </Badge>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function MeetingTable({ meetings }: { meetings: MeetingSummaryItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Tasks</TableHead>
              <TableHead className="text-center">Decisions</TableHead>
              <TableHead>PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => (
              <TableRow key={meeting.id}>
                <TableCell>
                  <Link href={`/meetings/${meeting.id}`} className="font-medium text-foreground hover:text-primary">
                    {meeting.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">Hosted by {meeting.host_name}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(meeting.meeting_date)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" /> {meeting.participants_count}
                  </span>
                </TableCell>
                <TableCell>
                  <MeetingStatusBadge status={meeting.status} />
                </TableCell>
                <TableCell className="text-center">{meeting.tasks_count}</TableCell>
                <TableCell className="text-center">{meeting.decisions_count}</TableCell>
                <TableCell>
                  {meeting.has_pdf ? (
                    <Badge variant="success">
                      <FileText className="h-3 w-3" aria-hidden="true" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline">—</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

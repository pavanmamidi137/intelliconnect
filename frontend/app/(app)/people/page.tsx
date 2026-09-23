"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PersonFormDialog } from "@/components/people/person-form-dialog";
import { ImportPeopleDialog } from "@/components/people/import-people-dialog";
import { BulkAddPeopleDialog } from "@/components/people/bulk-add-people-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { peopleService } from "@/services/people";
import { getErrorMessage, initials, pluralize } from "@/lib/utils";
import type { Person } from "@/types";

export default function PeoplePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      department: department || undefined,
      designation: designation || undefined,
      status: status || undefined,
      page,
    }),
    [debouncedSearch, department, designation, status, page]
  );

  /* eslint-disable react-hooks/set-state-in-effect -- reset selection when filters change */
  useEffect(() => {
    setSelected(new Set());
  }, [debouncedSearch, department, designation, status, page]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const peopleQuery = useQuery({
    queryKey: ["people", filters],
    queryFn: () => peopleService.list(filters),
  });

  const facetsQuery = useQuery({
    queryKey: ["people-facets"],
    queryFn: () => peopleService.facets(),
    staleTime: 5 * 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["people"] });
    queryClient.invalidateQueries({ queryKey: ["people-facets"] });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await peopleService.remove(deleteTarget.id);
      toast.success(`${deleteTarget.full_name} removed.`);
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't remove this person."));
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const confirmBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selected);
      const result = await peopleService.bulkRemove(ids);
      toast.success(`${result.deleted} ${pluralize(result.deleted, "person", "people")} removed.`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't remove the selected people."));
    } finally {
      setBulkDeleting(false);
    }
  };

  const data = peopleQuery.data;
  const people = data?.results ?? [];
  const loading = peopleQuery.isLoading;
  const error = peopleQuery.error as Error | null;

  const allVisibleSelected = people.length > 0 && people.every((person) => selected.has(person.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        people.forEach((person) => next.delete(person.id));
      } else {
        people.forEach((person) => next.add(person.id));
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Manage the people connected to your organization."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload aria-hidden="true" />
              Import People
            </Button>
            <Button variant="outline" onClick={() => setBulkAddOpen(true)}>
              <ListPlus aria-hidden="true" />
              Add Multiple
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setEditingPerson(null);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden="true" />
              Add Person
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by name, email, department, designation…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Search people"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <Select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by department"
          >
            <option value="">All departments</option>
            {facetsQuery.data?.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select
            value={designation}
            onChange={(e) => {
              setDesignation(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by designation"
          >
            <option value="">All designations</option>
            {facetsQuery.data?.designations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-2.5">
          <p className="text-sm font-medium text-foreground">
            {selected.size} {pluralize(selected.size, "person", "people")} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {error && <ErrorState message={error.message} onRetry={() => peopleQuery.refetch()} />}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.count === 0 && (
        <EmptyState
          icon={Users}
          title="No people yet"
          description="Add the people connected to your organization so IntelliConnect can match tasks to the right person."
          action={
            <Button variant="gradient" onClick={() => setFormOpen(true)}>
              <UserPlus aria-hidden="true" />
              Add Your First Person
            </Button>
          }
        />
      )}

      {/* Desktop table */}
      {!loading && !error && data && data.count > 0 && (
        <>
          <div className="glass hidden overflow-hidden rounded-xl md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all people on this page"
                    />
                  </TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="text-center">Meetings</TableHead>
                  <TableHead className="text-center">Tasks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-14" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => (
                  <TableRow
                    key={person.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/people/${person.id}`)}
                  >
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(person.id)}
                        onCheckedChange={() => toggleSelect(person.id)}
                        aria-label={`Select ${person.full_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{initials(person.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{person.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {person.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {person.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{person.department || "—"}</TableCell>
                    <TableCell>{person.designation || "—"}</TableCell>
                    <TableCell className="text-center">{person.meetings_count}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {person.pending_tasks > 0
                          ? `${person.tasks_count} (${person.pending_tasks} open)`
                          : person.tasks_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={person.is_active ? "success" : "secondary"}>
                        {person.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${person.full_name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/people/${person.id}`)}>
                            View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingPerson(person);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-danger focus:text-danger"
                            onClick={() => setDeleteTarget(person)}
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {people.map((person) => (
              <div key={person.id} className="glass glass-hover rounded-xl p-4 transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="pt-1">
                    <Checkbox
                      checked={selected.has(person.id)}
                      onCheckedChange={() => toggleSelect(person.id)}
                      aria-label={`Select ${person.full_name}`}
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(`/people/${person.id}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{initials(person.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{person.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.department || "No department"}
                          {person.designation ? ` · ${person.designation}` : ""}
                        </p>
                      </div>
                      <Badge variant={person.is_active ? "success" : "secondary"}>
                        {person.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>{person.email || "No email"}</span>
                      <span className="ml-auto">{person.meetings_count} meetings · {person.tasks_count} tasks</span>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {data.count} {pluralize(data.count, "person", "people")}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PersonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
        person={editingPerson}
      />
      <ImportPeopleDialog open={importOpen} onOpenChange={setImportOpen} onImported={refresh} />
      <BulkAddPeopleDialog open={bulkAddOpen} onOpenChange={setBulkAddOpen} onAdded={refresh} />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => !open && setBulkDeleteOpen(false)}
        title={`Remove ${selected.size} ${pluralize(selected.size, "person", "people")}?`}
        description="The selected people will be removed from your organization. Their assigned tasks will be unassigned. This can't be undone."
        confirmLabel="Remove Selected"
        loading={bulkDeleting}
        onConfirm={confirmBulkDelete}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.full_name ?? "this person"}?`}
        description="This person will be removed from your organization. Their assigned tasks will be unassigned."
        confirmLabel="Remove Person"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

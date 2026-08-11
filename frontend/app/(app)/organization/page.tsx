"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Globe,
  ListChecks,
  Pencil,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import { organizationService } from "@/services/organization";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { Organization } from "@/types";

export default function OrganizationPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["organization"],
    queryFn: () => organizationService.get(),
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    organization_type: Organization["organization_type"];
    website: string;
    description: string;
  }>({ name: "", organization_type: "company", website: "", description: "" });

  const beginEdit = (org: NonNullable<typeof query.data>) => {
    setForm({
      name: org.name,
      organization_type: org.organization_type,
      website: org.website,
      description: org.description,
    });
    setEditing(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Organization name is required.");
      return;
    }
    setSaving(true);
    try {
      await organizationService.update(form);
      toast.success("Organization updated successfully.");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't save your changes."));
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />;
  }

  const org = query.data;
  const hasStats = org.meetings_count > 0 || org.people_count > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Your organization profile and workspace statistics."
        actions={
          !editing && (
            <Button variant="outline" onClick={() => beginEdit(org)}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Organization
            </Button>
          )
        }
      />

      {/* Profile */}
      <Card>
        <CardContent className="space-y-5 p-6">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-type">Organization Type</Label>
                  <Select id="org-type" value={form.organization_type} onChange={(e) => setForm((f) => ({ ...f, organization_type: e.target.value as Organization["organization_type"] }))}>
                    {ORGANIZATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-website">Website</Label>
                  <Input id="org-website" type="url" placeholder="https://…" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description">Description</Label>
                <Textarea id="org-description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[100px]" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={save} disabled={saving}>
                  {saving && <Spinner className="h-4 w-4" />} Save Changes
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-sky-500/15 ring-1 ring-blue-500/20">
                  <Building2 className="h-7 w-7 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{org.name}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <Badge variant="secondary">
                      {ORGANIZATION_TYPES.find((t) => t.value === org.organization_type)?.label ?? org.organization_type}
                    </Badge>
                    {org.website && (
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
                          {org.website}
                        </a>
                      </span>
                    )}
                    <span>Member since {formatDate(org.created_at)}</span>
                  </div>
                </div>
              </div>
              {org.description && (
                <p className="border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  {org.description}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Real statistics — only when data exists */}
      {hasStats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="People" value={org.people_count} tint="indigo" />
          <StatCard icon={Video} label="Meetings" value={org.meetings_count} tint="violet" />
          <StatCard icon={CheckCircle2} label="Completed" value={org.completed_meetings} tint="emerald" />
          <StatCard icon={ListChecks} label="Open Tasks" value={org.open_tasks} tint="amber" />
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <h3 className="font-semibold text-foreground">Workspace statistics</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Statistics will appear here as your organization grows. No data yet — add people or upload a meeting to get started.
              </p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link href="/meetings/new">Upload a Meeting</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const TINTS = {
  indigo: "from-blue-500/10 to-blue-500/5 text-primary ring-blue-500/20",
  violet: "from-sky-500/10 to-sky-500/5 text-violet ring-sky-500/20",
  emerald: "from-emerald-500/10 to-emerald-500/5 text-success ring-emerald-500/20",
  amber: "from-amber-500/10 to-amber-500/5 text-warning ring-amber-500/20",
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tint: keyof typeof TINTS;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ${TINTS[tint]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

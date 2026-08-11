"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Bot,
  Building2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Lock,
  Moon,
  Palette,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn, getErrorMessage } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import { authService } from "@/services/auth";
import { organizationService } from "@/services/organization";
import type { Organization } from "@/types";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, organization, AI providers, and appearance." />
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="account"><UserRound aria-hidden="true" /> Account</TabsTrigger>
          <TabsTrigger value="organization"><Building2 aria-hidden="true" /> Organization</TabsTrigger>
          <TabsTrigger value="ai"><Bot aria-hidden="true" /> AI Settings</TabsTrigger>
          <TabsTrigger value="appearance"><Palette aria-hidden="true" /> Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="account"><AccountSettings /></TabsContent>
        <TabsContent value="organization"><OrganizationSettings /></TabsContent>
        <TabsContent value="ai"><AISettings /></TabsContent>
        <TabsContent value="appearance"><AppearanceSettings /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------------------------------------------------------- Account */
function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState({ full_name: user?.full_name ?? "", designation: user?.designation ?? "", department: user?.department ?? "" });

  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    if (!profile.full_name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setSavingProfile(true);
    try {
      await authService.updateProfile(profile);
      await refreshUser();
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't update your profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (pw.new_password.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pw.new_password !== pw.confirm_password) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await authService.changePassword(pw.current_password, pw.new_password);
      setPw({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't update your password."));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-full_name">Full Name</Label>
            <Input id="set-full_name" value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-email">Email</Label>
            <Input id="set-email" value={user?.email ?? ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email is your sign-in identifier and can&apos;t be changed.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="set-designation">Designation</Label>
              <Input id="set-designation" value={profile.designation} onChange={(e) => setProfile((p) => ({ ...p, designation: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-department">Department</Label>
              <Input id="set-department" value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="gradient" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Spinner className="h-4 w-4" />} Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" aria-hidden="true" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-current-pw">Current Password</Label>
            <div className="relative">
              <Input
                id="set-current-pw"
                type={showPw ? "text" : "password"}
                value={pw.current_password}
                onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Hide passwords" : "Show passwords"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="set-new-pw">New Password</Label>
              <Input id="set-new-pw" type={showPw ? "text" : "password"} value={pw.new_password} onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-confirm-pw">Confirm New Password</Label>
              <Input id="set-confirm-pw" type={showPw ? "text" : "password"} value={pw.confirm_password} onChange={(e) => setPw((p) => ({ ...p, confirm_password: e.target.value }))} autoComplete="new-password" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={savePassword} disabled={savingPw}>
              {savingPw && <Spinner className="h-4 w-4" />} Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------ Organization */
function OrganizationSettings() {
  const orgQuery = useQuery({ queryKey: ["organization"], queryFn: () => organizationService.get() });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    organization_type: Organization["organization_type"];
    website: string;
    description: string;
  }>({ name: "", organization_type: "company", website: "", description: "" });
  const [initialized, setInitialized] = useState(false);

  const org = orgQuery.data;
  if (org && !initialized) {
    setForm({ name: org.name, organization_type: org.organization_type, website: org.website, description: org.description });
    setInitialized(true);
  }

  if (orgQuery.isLoading) {
    return (
      <Card className="max-w-3xl">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Organization name is required.");
      return;
    }
    setSaving(true);
    try {
      await organizationService.update(form);
      toast.success("Organization updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't save your changes."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="set-org-name">Organization Name</Label>
          <Input id="set-org-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="set-org-type">Organization Type</Label>
            <Select id="set-org-type" value={form.organization_type} onChange={(e) => setForm((f) => ({ ...f, organization_type: e.target.value as Organization["organization_type"] }))}>
              {ORGANIZATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="set-org-website">Website</Label>
            <Input id="set-org-website" type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-org-desc">Description</Label>
          <Textarea id="set-org-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[100px]" />
        </div>
        <div className="flex justify-end">
          <Button variant="gradient" onClick={save} disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />} Save Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------- AI */
function AISettings() {
  const query = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => authService.aiProviderStatus(),
    staleTime: 5 * 60_000,
  });

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" aria-hidden="true" /> AI Provider Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          IntelliConnect uses a provider-independent AI architecture. Providers are
          configured with environment variables on the backend — API keys are never
          shown or exposed here.
        </p>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="text-sm text-danger">{(query.error as Error).message}</p>
        ) : (
          <ul className="space-y-2">
            {query.data?.providers.map((provider) => (
              <li
                key={provider.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      provider.configured ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Bot className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{provider.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {provider.configured ? `Model: ${provider.model}` : provider.detail}
                    </p>
                  </div>
                </div>
                {provider.configured ? (
                  <Badge variant="success"><Check className="h-3 w-3" aria-hidden="true" /> Connected</Badge>
                ) : (
                  <Badge variant="secondary">Not configured</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Current primary provider:{" "}
            <strong className="capitalize text-foreground">{query.data?.primary ?? "—"}</strong>. Confidence
            threshold for automatic task assignment:{" "}
            <strong className="text-foreground">{Math.round((query.data?.threshold ?? 0.75) * 100)}%</strong>.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------ Appearance */
function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", label: "Light", icon: Sun, description: "Bright, clean interface" },
    { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes at night" },
    { value: "system", label: "System", icon: Laptop, description: "Follow your device preference" },
  ];

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all",
                  active
                    ? "border-primary/60 bg-accent/50 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <option.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
                {active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Check className="h-3 w-3" aria-hidden="true" /> Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Your preference is saved on this device and applied across IntelliConnect.
        </p>
      </CardContent>
    </Card>
  );
}

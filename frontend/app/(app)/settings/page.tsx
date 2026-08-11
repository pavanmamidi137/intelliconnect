"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  Laptop,
  Lock,
  Moon,
  Paintbrush,
  Palette,
  RotateCcw,
  Sun,
  Type,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
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
import { useSiteTheme } from "@/components/theme/site-theme-provider";
import { isDefaultTheme } from "@/lib/theme-utils";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import { authService } from "@/services/auth";
import { organizationService } from "@/services/organization";
import type { Organization, SiteFontFamily, SiteRadius, SiteTheme } from "@/types";

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, organization, and appearance." />
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="account"><UserRound aria-hidden="true" /> Account</TabsTrigger>
          <TabsTrigger value="organization"><Building2 aria-hidden="true" /> Organization</TabsTrigger>
          <TabsTrigger value="appearance"><Palette aria-hidden="true" /> Appearance</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="brand"><Paintbrush aria-hidden="true" /> Brand &amp; Design</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="account"><AccountSettings /></TabsContent>
        <TabsContent value="organization"><OrganizationSettings /></TabsContent>
        <TabsContent value="appearance"><AppearanceSettings /></TabsContent>
        {isAdmin && <TabsContent value="brand"><BrandDesignSettings /></TabsContent>}
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

/* ----------------------------------------------------- Brand & Design */

const FONT_OPTIONS: { value: SiteFontFamily; label: string }[] = [
  { value: "default", label: "Default (Geist)" },
  { value: "system", label: "System UI" },
  { value: "serif", label: "Elegant Serif" },
  { value: "mono", label: "Monospace" },
];

const RADIUS_OPTIONS: { value: SiteRadius; label: string }[] = [
  { value: "0.5rem", label: "Soft" },
  { value: "0.75rem", label: "Rounded (default)" },
  { value: "1rem", label: "Extra rounded" },
  { value: "0rem", label: "Sharp" },
];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const normalized = value || "";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="font-mono text-xs text-muted-foreground">{normalized || "Default"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {normalized && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-medium text-muted-foreground hover:text-danger"
            aria-label={`Reset ${label} to default`}
          >
            Reset
          </button>
        )}
        <input
          type="color"
          value={normalized || "#2563eb"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
        />
      </div>
    </div>
  );
}

function BrandDesignSettings() {
  const { theme, apply, reset } = useSiteTheme();
  const [draft, setDraft] = useState<SiteTheme>(theme);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncedRef = useRef(false);

  // Keep the form in sync when the server theme arrives or after a save.
  // In-place edits don't change `updated_at`, so they never clobber the
  // user's draft while they're picking colors.
  useEffect(() => {
    if (!syncedRef.current || theme.updated_at !== draft.updated_at) {
      syncedRef.current = true;
      setDraft(theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const update = (patch: Partial<SiteTheme>) => {
    setError(null);
    const next = { ...draft, ...patch };
    setDraft(next);
    // Live preview — applied to the whole UI immediately.
    void apply(next);
  };

  const dirty = !isDefaultTheme(draft);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await apply(draft, { persist: true });
      toast.success("Theme saved — it now applies to the whole platform.");
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't save the theme."));
      toast.error(getErrorMessage(err, "We couldn't save the theme."));
    } finally {
      setSaving(false);
    }
  };

  const doReset = async () => {
    setResetting(true);
    setError(null);
    try {
      await reset();
      setDraft(theme);
      toast.success("Theme reset to the default design system.");
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't reset the theme."));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-primary" aria-hidden="true" /> Brand &amp; Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Customize the platform look — theme color, accent, backgrounds, corner radius and
            fonts. Changes apply live as you pick; <strong className="text-foreground">Save</strong>{" "}
            publishes them for every user. Headings keep the Saira Condensed display font.
          </p>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colors</p>
            <ColorField label="Theme color" value={draft.primary_color} onChange={(v) => update({ primary_color: v })} />
            <ColorField label="Accent color" value={draft.accent_color} onChange={(v) => update({ accent_color: v })} />
            <ColorField label="Light background" value={draft.light_background} onChange={(v) => update({ light_background: v })} />
            <ColorField label="Dark background" value={draft.dark_background} onChange={(v) => update({ dark_background: v })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand-radius">Corner radius</Label>
              <Select id="brand-radius" value={draft.radius} onChange={(e) => update({ radius: e.target.value as SiteRadius })}>
                {RADIUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-font">Body font</Label>
              <Select id="brand-font" value={draft.font_family} onChange={(e) => update({ font_family: e.target.value as SiteFontFamily })}>
                {FONT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button variant="gradient" onClick={save} disabled={saving || resetting}>
              {saving && <Spinner className="h-4 w-4" />} Save Theme
            </Button>
            <Button variant="outline" onClick={doReset} disabled={saving || resetting}>
              {resetting ? <Spinner className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
              Reset to Defaults
            </Button>
            {dirty && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                Live preview — Save publishes it to the whole platform
              </span>
            )}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4 text-primary" aria-hidden="true" /> Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-sm">
            <p className="font-display text-lg font-semibold">Primary color button</p>
            <p className="mt-0.5 text-sm opacity-90">Text stays readable on any brand color.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
              <Check className="h-3 w-3" aria-hidden="true" /> Success badge
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              Muted chip
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Eye, EyeOff, Lock, Mail, MoveRight, User } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { ORGANIZATION_TYPES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Enter your full name."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm_password: z.string().min(1, "Confirm your password."),
    organization_name: z.string().min(2, "Enter your organization name."),
    organization_type: z.string().min(1, "Select an organization type."),
    designation: z.string().optional(),
    department: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { organization_type: "company" },
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitting(true);
    try {
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        confirm_password: values.confirm_password,
        organization_name: values.organization_name,
        organization_type: values.organization_type,
        designation: values.designation ?? "",
        department: values.department ?? "",
      });
      toast.success("Your workspace is ready. Welcome to IntelliConnect!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't create your account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-[var(--animate-slide-up)]">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Create your workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up your organization and profile in under a minute.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="full_name"
                placeholder="e.g. Aisha Khan"
                className="pl-9"
                aria-invalid={Boolean(errors.full_name)}
                {...register("full_name")}
              />
            </div>
            {errors.full_name && <p className="text-xs text-danger">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="pl-9"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="pl-9 pr-10"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="pl-9"
                  aria-invalid={Boolean(errors.confirm_password)}
                  {...register("confirm_password")}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-danger">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Your Organization
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization_name">Organization Name</Label>
                <Input
                  id="organization_name"
                  placeholder="e.g. Acme Labs"
                  aria-invalid={Boolean(errors.organization_name)}
                  {...register("organization_name")}
                />
                {errors.organization_name && (
                  <p className="text-xs text-danger">{errors.organization_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization_type">Organization Type</Label>
                <Select id="organization_type" {...register("organization_type")}>
                  {ORGANIZATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                {errors.organization_type && (
                  <p className="text-xs text-danger">{errors.organization_type.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation (optional)</Label>
              <Input id="designation" placeholder="e.g. Engineering Manager" {...register("designation")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department (optional)</Label>
              <Input id="department" placeholder="e.g. Engineering" {...register("department")} />
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={submitting}>
            {submitting ? (
              <Spinner className="h-4 w-4 border-white/60" />
            ) : (
              <>
                Create Account <MoveRight aria-hidden="true" />
              </>
            )}
          </Button>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account you agree to IntelliConnect&apos;s terms of service and
            privacy policy.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

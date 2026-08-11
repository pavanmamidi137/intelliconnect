"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, KeyRound, Lock, Mail, MoveRight } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

const emailSchema = z.object({
  email: z.email("Enter a valid email address."),
});

const resetSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters."),
  confirm_password: z.string().min(1, "Confirm your password."),
});

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState<string | null>(tokenFromUrl);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const emailForm = useForm<{ email: string }>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<{ new_password: string; confirm_password: string }>({
    resolver: zodResolver(resetSchema),
  });

  const requestReset = async (values: { email: string }) => {
    setSubmitting(true);
    try {
      const response = await api.post<{ message: string; token?: string }>(
        "/auth/forgot-password/",
        values
      );
      setSent(true);
      if (response.token) {
        setToken(response.token);
        toast.success("Reset link generated for development. Set your new password below.");
      } else {
        toast.success(response.message ?? "Reset link sent.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (values: { new_password: string; confirm_password: string }) => {
    if (values.new_password !== values.confirm_password) {
      resetForm.setError("confirm_password", { message: "Passwords do not match." });
      return;
    }
    if (!token) return;
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password/", {
        token,
        new_password: values.new_password,
      });
      setDone(true);
      toast.success("Password reset successfully. You can now sign in.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't reset your password. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="animate-[var(--animate-slide-up)] text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft">
          <CheckCircle2 className="h-7 w-7 text-success" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Password reset</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your password has been updated. Sign in with your new password.
        </p>
        <Button asChild variant="gradient" className="mt-6 w-full" size="lg">
          <a href="/login">Go to Sign In</a>
        </Button>
      </div>
    );
  }

  if (token) {
    return (
      <div className="animate-[var(--animate-slide-up)]">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a new password for your IntelliConnect account.
        </p>
        <form onSubmit={resetForm.handleSubmit(resetPassword)} className="mt-8 space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="new_password"
                type="password"
                placeholder="Min. 8 characters"
                className="pl-9"
                autoComplete="new-password"
                {...resetForm.register("new_password")}
              />
            </div>
            {resetForm.formState.errors.new_password && (
              <p className="text-xs text-danger">{resetForm.formState.errors.new_password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="confirm_password"
                type="password"
                placeholder="Repeat new password"
                className="pl-9"
                autoComplete="new-password"
                {...resetForm.register("confirm_password")}
              />
            </div>
            {resetForm.formState.errors.confirm_password && (
              <p className="text-xs text-danger">{resetForm.formState.errors.confirm_password.message}</p>
            )}
          </div>
          <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Spinner className="h-4 w-4 border-white/60" /> : <>Reset Password <MoveRight aria-hidden="true" /></>}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-[var(--animate-slide-up)]">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Forgot password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {sent
          ? "If an account exists for this email, a reset link has been sent. Check your inbox."
          : "Enter the email address for your account and we'll send you a reset link."}
      </p>

      {!sent && (
        <form onSubmit={emailForm.handleSubmit(requestReset)} className="mt-8 space-y-5" noValidate>
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
                {...emailForm.register("email")}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p className="text-xs text-danger">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Spinner className="h-4 w-4 border-white/60" /> : <>Send Reset Link <MoveRight aria-hidden="true" /></>}
          </Button>
        </form>
      )}

      {sent && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-success/25 bg-success-soft/60 p-4 text-sm text-success">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            We&apos;ve sent a secure reset link. The link expires in 30 minutes.
          </span>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <a href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </a>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<Spinner className="mx-auto mt-10" />}>
        <ForgotPasswordInner />
      </Suspense>
    </AuthLayout>
  );
}

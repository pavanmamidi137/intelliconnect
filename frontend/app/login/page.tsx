"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MoveRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/utils";
import { authService } from "@/services/auth";

const emailSchema = z.object({
  email: z.email("Enter a valid email address."),
});

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

const passwordSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

type Mode = "email" | "otp" | "password";

const RESEND_SECONDS = 30;

export default function LoginPage() {
  const { login, loginWithOtp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    return () => {
      if (resendTimer.current) clearInterval(resendTimer.current);
    };
  }, []);

  const startResendCountdown = () => {
    setResendIn(RESEND_SECONDS);
    if (resendTimer.current) clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendIn((seconds) => {
        if (seconds <= 1 && resendTimer.current) clearInterval(resendTimer.current);
        return seconds - 1;
      });
    }, 1000);
  };

  const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
    void emailForm.handleSubmit(requestCode)(event);
  };
  const submitOtp = (event: React.FormEvent<HTMLFormElement>) => {
    void otpForm.handleSubmit(verifyCode)(event);
  };
  const submitPasswordForm = (event: React.FormEvent<HTMLFormElement>) => {
    void passwordForm.handleSubmit(submitPassword)(event);
  };

  const requestCode = async (values: EmailValues) => {
    setSubmitting(true);
    setNoAccount(false);
    setDevCode(null);
    try {
      const result = await authService.requestOtp(values.email);
      if (!result.account_exists) {
        setNoAccount(true);
        setEmail(values.email);
        toast.info(result.message);
        return;
      }
      setEmail(values.email);
      // Platform admins skip the code — the backend tells us to use the
      // password form directly.
      if (result.login_mode === "password") {
        setMode("password");
        passwordForm.setValue("email", values.email);
        toast.info(result.message || "Platform admin — enter your password.");
        return;
      }
      if (result.dev_code) {
        setDevCode(result.dev_code);
      }
      setMode("otp");
      otpForm.reset();
      startResendCountdown();
      toast.success(result.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't send the code. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (resendIn > 0) return;
    setSubmitting(true);
    try {
      const result = await authService.requestOtp(email);
      if (result.login_mode === "password") {
        setMode("password");
        passwordForm.setValue("email", email);
        return;
      }
      if (result.dev_code) setDevCode(result.dev_code);
      startResendCountdown();
      toast.success("A new code has been sent.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't resend the code."));
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (values: OtpValues) => {
    setSubmitting(true);
    try {
      const user = await loginWithOtp(email, values.code);
      toast.success(`Welcome back${user.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!`);
      router.push(user.role === "superadmin" || user.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "That code didn't work. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async (values: PasswordValues) => {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast.success("Welcome back to IntelliConnect!");
      router.push(user.role === "superadmin" || user.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to sign in. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-[var(--animate-slide-up)]">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {mode === "otp" ? "Check your email" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "otp"
            ? `We sent a 6-digit code to ${email}. Enter it below to continue.`
            : "Welcome back. Sign in with your email — we'll send you a secure code."}
        </p>

        {mode === "email" && (
          <form onSubmit={submitEmail} className="mt-8 space-y-5" noValidate>
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
                  aria-invalid={Boolean(emailForm.formState.errors.email)}
                  {...emailForm.register("email")}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-xs text-danger">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            {noAccount && (
              <div className="rounded-lg border border-warning/30 bg-warning-soft/60 p-3 text-sm text-warning">
                No account found for this email.{" "}
                <Link href="/register" className="font-semibold underline">
                  Create one now
                </Link>{" "}
                — we&apos;ll set up your organization.
              </div>
            )}

            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={submitting}>
              {submitting ? <Spinner className="h-4 w-4 border-white/60" /> : <>Send Verification Code <MoveRight aria-hidden="true" /></>}
            </Button>
          </form>
        )}

        {mode === "otp" && (
          <div className="mt-8 space-y-5">
            {devCode && (
              <div className="rounded-lg border border-primary/25 bg-accent p-3 text-sm text-accent-foreground">
                <span className="font-semibold">Development mode:</span> no email backend is
                configured, so your code is{" "}
                <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-sm font-bold tracking-widest text-primary-foreground">
                  {devCode}
                </span>
              </div>
            )}
            <form onSubmit={submitOtp} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="code">6-digit code</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    maxLength={6}
                    className="pl-9 font-mono text-lg tracking-[0.35em]"
                    aria-invalid={Boolean(otpForm.formState.errors.code)}
                    {...otpForm.register("code")}
                  />
                </div>
                {otpForm.formState.errors.code && (
                  <p className="text-xs text-danger">{otpForm.formState.errors.code.message}</p>
                )}
              </div>

              <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={submitting}>
                {submitting ? <Spinner className="h-4 w-4 border-white/60" /> : <>Verify & Sign In <MoveRight aria-hidden="true" /></>}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={resendCode}
                disabled={resendIn > 0 || submitting}
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => setMode("email")}
                className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Change email
              </button>
            </div>
          </div>
        )}

        {mode === "password" && (
          <form onSubmit={submitPasswordForm} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="pw-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="pw-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="pl-9"
                  aria-invalid={Boolean(passwordForm.formState.errors.email)}
                  {...passwordForm.register("email")}
                />
              </div>
              {passwordForm.formState.errors.email && (
                <p className="text-xs text-danger">{passwordForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pw-password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="pw-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  aria-invalid={Boolean(passwordForm.formState.errors.password)}
                  {...passwordForm.register("password")}
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
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-danger">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={submitting}>
              {submitting ? <Spinner className="h-4 w-4 border-white/60" /> : <>Sign In <MoveRight aria-hidden="true" /></>}
            </Button>
          </form>
        )}

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "password" ? "email" : "password");
              setNoAccount(false);
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {mode === "password" ? (
              <>
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Use email verification instead
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" /> Sign in with password instead
              </>
            )}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Get started free
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

"use client";

import { useState, type FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Home, KeyRound, CheckCircle } from "lucide-react";
import Button from "@/components/Button";
import { resetPassword } from "@/services/authService";

// We use a separate inner component so Suspense wraps useSearchParams correctly.
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      errs.password = "Password must contain at least one uppercase letter.";
    } else if (!/[0-9]/.test(password)) {
      errs.password = "Password must contain at least one number.";
    }
    if (!confirmPassword) {
      errs.confirm = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirm = "Passwords do not match.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      setApiError("Missing reset token. Please use the link from your email.");
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      await resetPassword({ token, password, confirmPassword });
      setSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Password reset failed. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-charcoal/60 mb-6">
          This reset link is invalid. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-forest-green hover:text-soft-gold transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return success ? (
    /* ── Success state ── */
    <div className="text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-forest-green/10 mx-auto mb-5">
        <CheckCircle size={28} className="text-forest-green" />
      </div>
      <h2 className="font-display text-xl font-semibold text-forest-green mb-3">
        Password reset!
      </h2>
      <p className="text-sm text-charcoal/60 mb-6">
        Your password has been changed successfully. Redirecting you to sign in…
      </p>
      <Link
        href="/login"
        className="text-sm font-medium text-forest-green hover:text-soft-gold transition-colors"
      >
        Sign in now
      </Link>
    </div>
  ) : (
    /* ── Form state ── */
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {apiError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {apiError}
        </div>
      )}

      {/* New password */}
      <div>
        <label
          htmlFor="rp-password"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="rp-password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters, uppercase & number"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            autoComplete="new-password"
            className={[
              "w-full rounded-lg border bg-white text-charcoal text-sm",
              "placeholder:text-charcoal/40 pr-10 pl-4 py-2.5",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green",
              errors.password
                ? "border-red-400"
                : "border-charcoal/20 hover:border-charcoal/40",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="rp-confirm"
          className="block text-sm font-medium text-charcoal mb-1.5"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="rp-confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            autoComplete="new-password"
            className={[
              "w-full rounded-lg border bg-white text-charcoal text-sm",
              "placeholder:text-charcoal/40 pr-10 pl-4 py-2.5",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green",
              errors.confirm
                ? "border-red-400"
                : "border-charcoal/20 hover:border-charcoal/40",
            ].join(" ")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirm && (
          <p className="mt-1.5 text-xs text-red-500">{errors.confirm}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        loading={loading}
      >
        Set New Password
      </Button>

      <p className="text-center">
        <Link
          href="/login"
          className="text-sm text-charcoal/50 hover:text-forest-green transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page component — wraps with Suspense for useSearchParams
// ---------------------------------------------------------------------------

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg border border-charcoal/8 p-8 lg:p-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green">
              <Home size={18} className="text-warm-ivory" strokeWidth={1.8} />
            </span>
            <span className="font-display text-xl font-semibold text-forest-green">
              Nestora
            </span>
          </Link>

          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-forest-green/10 mb-5">
            <KeyRound size={22} className="text-forest-green" />
          </div>

          <h1 className="font-display text-2xl font-semibold text-forest-green mb-2">
            Set a new password
          </h1>
          <p className="text-sm text-charcoal/55 mb-8">
            Choose a strong password for your Nestora account.
          </p>

          <Suspense fallback={<div className="animate-pulse h-48 bg-charcoal/5 rounded-lg" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

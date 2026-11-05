"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Home, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Input } from "@/components/Input";
import Button from "@/components/Button";
import { forgotPassword } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Development only — shows the reset token since no email provider is configured
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrPhone.trim()) {
      setError("Email or phone number is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword({ emailOrPhone });
      setSuccess(true);
      if (result.devToken) {
        setDevToken(result.devToken);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
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

          {success ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-forest-green/10 mx-auto mb-5">
                <CheckCircle size={28} className="text-forest-green" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-forest-green mb-3">
                Check your inbox
              </h1>
              <p className="text-sm text-charcoal/60 leading-relaxed mb-6">
                If an account is associated with that email or phone number, a
                password reset link has been sent. The link expires in 1 hour.
              </p>

              {/* Development-only token hint */}
              {devToken && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    ⚠️ Development mode — no email provider configured
                  </p>
                  <p className="text-xs text-amber-700 mb-2">
                    Use this token to test the reset flow. This message is never
                    shown in production.
                  </p>
                  <Link
                    href={`/reset-password?token=${devToken}`}
                    className="text-xs font-mono text-forest-green underline break-all"
                  >
                    /reset-password?token={devToken}
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-forest-green/10 mb-5">
                <Mail size={22} className="text-forest-green" />
              </div>

              <h1 className="font-display text-2xl font-semibold text-forest-green mb-2">
                Forgot your password?
              </h1>
              <p className="text-sm text-charcoal/55 mb-8">
                Enter the email address or phone number associated with your
                account. We&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                  label="Email address or phone number"
                  type="text"
                  placeholder="you@example.com"
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    setError(null);
                  }}
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  loading={loading}
                >
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-charcoal/55 hover:text-forest-green transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

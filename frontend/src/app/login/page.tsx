"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Home, LogIn } from "lucide-react";
import { Input } from "@/components/Input";
import Button from "@/components/Button";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useAuth } from "@/contexts/AuthContext";
import type { LoginFormData } from "@/types";

type FormErrors = Partial<Record<keyof LoginFormData, string>>;

function validateForm(data: LoginFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.emailOrPhone.trim()) {
    errors.emailOrPhone = "Email or phone number is required.";
  }
  if (!data.password) {
    errors.password = "Password is required.";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/auth/")) return "/";
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirectPath(
    searchParams.get("redirect") ?? searchParams.get("next"),
  );
  const { loginUser } = useAuth();

  const [form, setForm] = useState<LoginFormData>({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(
    searchParams.get("error"),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof LoginFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setApiError(null);
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      await loginUser({
        emailOrPhone: form.emailOrPhone,
        password: form.password,
        rememberMe: form.rememberMe,
      });
      router.push(redirectPath);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-lg overflow-hidden border border-charcoal/8">
        {/* Left — Illustration panel */}
        <div className="hidden lg:block relative">
          <Image
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80"
            alt="Nestora apartment"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-forest-green/75" />
          <div className="relative z-10 flex flex-col h-full p-10 justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-warm-ivory/10">
                <Home size={18} className="text-warm-ivory" strokeWidth={1.8} />
              </span>
              <span className="font-display text-xl font-semibold text-warm-ivory">
                Nestora
              </span>
            </Link>
            <div>
              <h2 className="font-display text-3xl font-semibold text-warm-ivory mb-3 leading-tight">
                Welcome back to your home away from home.
              </h2>
              <p className="text-warm-ivory/65 text-sm leading-relaxed">
                Sign in to manage your bookings, view upcoming stays, and
                discover new apartments.
              </p>
            </div>
          </div>
        </div>

        {/* Right — Form panel */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-forest-green">
              <Home size={16} className="text-warm-ivory" strokeWidth={1.8} />
            </span>
            <span className="font-display text-lg font-semibold text-forest-green">
              Nestora
            </span>
          </Link>

          <h1 className="font-display text-2xl font-semibold text-forest-green mb-1">
            Sign In
          </h1>
          <p className="text-sm text-charcoal/55 mb-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-forest-green font-medium hover:text-soft-gold transition-colors"
            >
              Create one for free
            </Link>
          </p>

          {/* API-level error banner */}
          {apiError && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            >
              {apiError}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <GoogleSignInButton
              next={redirectPath}
              onError={(message) => setApiError(message || null)}
            />
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-charcoal/10" />
              <span className="text-xs text-charcoal/40">
                or sign in with email
              </span>
              <span className="h-px flex-1 bg-charcoal/10" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Email address or phone number"
              type="text"
              placeholder="you@example.com"
              value={form.emailOrPhone}
              onChange={(e) => handleChange("emailOrPhone", e.target.value)}
              error={errors.emailOrPhone}
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-charcoal"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-charcoal/50 hover:text-forest-green transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  autoComplete="current-password"
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

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <input
                id="remember-me"
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => handleChange("rememberMe", e.target.checked)}
                className="w-4 h-4 rounded border-charcoal/30 text-forest-green accent-forest-green cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="text-sm text-charcoal/65 cursor-pointer select-none"
              >
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
            >
              <LogIn size={16} />
              Sign In
            </Button>
          </form>

          <p className="text-xs text-charcoal/40 text-center mt-6">
            By signing in, you agree to our{" "}
            <Link href="#" className="hover:text-charcoal/60 transition-colors underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="hover:text-charcoal/60 transition-colors underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Home, UserPlus } from "lucide-react";
import { Input } from "@/components/Input";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import type { RegisterFormData } from "@/types";

type FormErrors = Partial<Record<keyof RegisterFormData, string>>;

function validateForm(data: RegisterFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (data.fullName.trim().length < 3) {
    errors.fullName = "Name must be at least 3 characters.";
  }

  if (!data.email.trim() && !data.phone.trim()) {
    errors.email = "At least one of email or phone is required.";
  }

  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (data.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(data.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!data.password) {
    errors.password = "Password is required.";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = "Password must contain at least one number.";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!data.agreeToTerms) {
    errors.agreeToTerms = "You must agree to the terms and conditions.";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();

  const [form, setForm] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    field: keyof RegisterFormData,
    value: string | boolean,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setApiError(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      await registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    if (!form.password) return null;
    const score =
      (form.password.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(form.password) ? 1 : 0) +
      (/[0-9]/.test(form.password) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0);
    if (score <= 1) return { label: "Weak", color: "bg-red-400", width: "w-1/4" };
    if (score === 2) return { label: "Fair", color: "bg-yellow-400", width: "w-2/4" };
    if (score === 3) return { label: "Good", color: "bg-blue-400", width: "w-3/4" };
    return { label: "Strong", color: "bg-forest-green", width: "w-full" };
  })();

  return (
    <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-lg overflow-hidden border border-charcoal/8">
        {/* Left — Illustration panel */}
        <div className="hidden lg:block relative">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80"
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
                Join thousands of guests who trust Nestora.
              </h2>
              <p className="text-warm-ivory/65 text-sm leading-relaxed">
                Create your free account and unlock access to Nigeria&apos;s finest
                short-stay apartments.
              </p>
            </div>
          </div>
        </div>

        {/* Right — Form panel */}
        <div className="p-8 lg:p-12 flex flex-col justify-center overflow-y-auto">
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
            Create Account
          </h1>
          <p className="text-sm text-charcoal/55 mb-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-forest-green font-medium hover:text-soft-gold transition-colors"
            >
              Sign in
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

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              placeholder="Adaeze Okafor"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              error={errors.fullName}
              autoComplete="name"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              autoComplete="email"
              hint="Email or phone is required — you may provide both."
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+234 800 000 0000"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              error={errors.phone}
              autoComplete="tel"
            />

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters, uppercase & number"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
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
              {/* Strength bar */}
              {passwordStrength && !errors.password && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-charcoal/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
                    />
                  </div>
                  <p className="text-xs text-charcoal/50 mt-1">
                    Password strength:{" "}
                    <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                  className={[
                    "w-full rounded-lg border bg-white text-charcoal text-sm",
                    "placeholder:text-charcoal/40 pr-10 pl-4 py-2.5",
                    "transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green",
                    errors.confirmPassword
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
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-start gap-3">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={form.agreeToTerms}
                  onChange={(e) => handleChange("agreeToTerms", e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-charcoal/30 accent-forest-green cursor-pointer shrink-0"
                />
                <label
                  htmlFor="agree-terms"
                  className="text-sm text-charcoal/65 cursor-pointer select-none"
                >
                  I agree to the{" "}
                  <Link
                    href="#"
                    className="text-forest-green hover:text-soft-gold transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-forest-green hover:text-soft-gold transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.agreeToTerms}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
            >
              <UserPlus size={16} />
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

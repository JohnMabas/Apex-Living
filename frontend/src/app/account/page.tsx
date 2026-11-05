"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  LogOut,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Home,
} from "lucide-react";
import { Input } from "@/components/Input";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, changePassword } from "@/services/authService";

// ---------------------------------------------------------------------------
// Profile form section
// ---------------------------------------------------------------------------

function ProfileSection() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if user loads after mount
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        email: user.email ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() && !form.phone.trim()) {
      setError("At least one of email or phone is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await updateProfile({
        fullName: form.fullName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      updateUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-charcoal/8 p-6 lg:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green/10">
          <User size={18} className="text-forest-green" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-forest-green">
            Personal Information
          </h2>
          <p className="text-xs text-charcoal/50">Update your name, email, and phone</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          <CheckCircle size={15} />
          Profile updated successfully.
        </div>
      )}
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
          label="Full Name"
          type="text"
          value={form.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          autoComplete="name"
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          hint="Email or phone is required — you may update both."
          autoComplete="email"
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+234 800 000 0000"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          autoComplete="tel"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
        >
          <Save size={15} />
          Save Changes
        </Button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Change password section
// ---------------------------------------------------------------------------

function ChangePasswordSection() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = "Current password is required.";
    if (form.newPassword.length < 8) {
      errs.newPassword = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(form.newPassword)) {
      errs.newPassword = "Must contain at least one uppercase letter.";
    } else if (!/[0-9]/.test(form.newPassword)) {
      errs.newPassword = "Must contain at least one number.";
    }
    if (!form.confirmNewPassword) {
      errs.confirmNewPassword = "Please confirm your new password.";
    } else if (form.newPassword !== form.confirmNewPassword) {
      errs.confirmNewPassword = "Passwords do not match.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const passwordInput = (
    field: keyof typeof form,
    label: string,
    show: boolean,
    toggle: () => void,
    autoComplete: string,
  ) => (
    <div>
      <label
        htmlFor={`cp-${field}`}
        className="block text-sm font-medium text-charcoal mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={`cp-${field}`}
          type={show ? "text" : "password"}
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          autoComplete={autoComplete}
          className={[
            "w-full rounded-lg border bg-white text-charcoal text-sm",
            "placeholder:text-charcoal/40 pr-10 pl-4 py-2.5 transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green",
            fieldErrors[field]
              ? "border-red-400"
              : "border-charcoal/20 hover:border-charcoal/40",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {fieldErrors[field] && (
        <p className="mt-1.5 text-xs text-red-500">{fieldErrors[field]}</p>
      )}
    </div>
  );

  return (
    <section className="bg-white rounded-2xl border border-charcoal/8 p-6 lg:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green/10">
          <Lock size={18} className="text-forest-green" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-forest-green">
            Change Password
          </h2>
          <p className="text-xs text-charcoal/50">
            Use a strong password you don&apos;t use elsewhere
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          <CheckCircle size={15} />
          Password changed successfully.
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {passwordInput(
          "currentPassword",
          "Current Password",
          showCurrent,
          () => setShowCurrent((s) => !s),
          "current-password",
        )}
        {passwordInput(
          "newPassword",
          "New Password",
          showNew,
          () => setShowNew((s) => !s),
          "new-password",
        )}
        {passwordInput(
          "confirmNewPassword",
          "Confirm New Password",
          showConfirm,
          () => setShowConfirm((s) => !s),
          "new-password",
        )}

        <Button type="submit" variant="primary" size="md" loading={loading}>
          <Lock size={15} />
          Change Password
        </Button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logoutUser } = useAuth();

  // Redirect to login if not authenticated and loading is done
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/account");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null; // Will redirect via useEffect

  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8">
          <Link href="/" className="hover:text-forest-green transition-colors flex items-center gap-1">
            <Home size={12} />
            Home
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">My Account</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-forest-green text-warm-ivory font-semibold text-xl font-display shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-green">
              {user.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {user.email && (
                <span className="flex items-center gap-1.5 text-xs text-charcoal/55">
                  <Mail size={12} />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1.5 text-xs text-charcoal/55">
                  <Phone size={12} />
                  {user.phone}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-forest-green/10 text-forest-green font-medium">
                {user.role === "ADMIN" ? "Administrator" : "Customer"}
              </span>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <ProfileSection />
          <ChangePasswordSection />

          {/* Sign out */}
          <section className="bg-white rounded-2xl border border-charcoal/8 p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50">
                <LogOut size={18} className="text-red-500" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-charcoal">
                  Sign Out
                </h2>
                <p className="text-xs text-charcoal/50">
                  Sign out of your Nestora account on this device
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut size={15} />
              Sign Out
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

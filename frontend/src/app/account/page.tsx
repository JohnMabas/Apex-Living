"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  CalendarDays,
  CreditCard,
  Bell,
} from "lucide-react";
import { Input } from "@/components/Input";
import Button from "@/components/Button";
import GoogleSignInButton from "@/components/GoogleSignInButton";
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
    country: user?.country ?? "",
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
        country: user.country ?? "",
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
        country: form.country.trim(),
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
          <p className="text-xs text-charcoal/50">
            Update your name, contact details and country
          </p>
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
          readOnly={Boolean(user?.isGoogleLinked)}
          hint={
            user?.isGoogleLinked
              ? "Managed by your Google account and verified at sign-in."
              : "Email or phone is required — you may update both."
          }
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
        <Input
          label="Country"
          type="text"
          placeholder="Nigeria"
          value={form.country}
          onChange={(e) => handleChange("country", e.target.value)}
          autoComplete="country-name"
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
  const [linkNotice, setLinkNotice] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked") === "1") {
      setLinkNotice("Google account linked successfully.");
    }
    const error = params.get("link_error");
    if (error) setLinkError(error);
  }, []);

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
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-forest-green text-warm-ivory font-semibold text-xl font-display shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              initials
            )}
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
              {user.isGoogleLinked && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-soft-gold/15 text-charcoal/70 font-medium">
                  Google connected
                </span>
              )}
            </div>
          </div>
        </div>

        {linkNotice && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle size={15} />
            {linkNotice}
          </div>
        )}
        {linkError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {linkError}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {/* Quick links */}
          <section className="bg-white rounded-2xl border border-charcoal/8 p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green/10">
                <CalendarDays size={18} className="text-forest-green" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-forest-green">My Bookings</h2>
                <p className="text-xs text-charcoal/50">View and manage your reservations</p>
              </div>
            </div>
            <Link
              href="/account/bookings"
              className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              View My Bookings
            </Link>
          </section>

          {/* Payment History */}
          <section className="bg-white rounded-2xl border border-charcoal/8 p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green/10">
                <CreditCard size={18} className="text-forest-green" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-forest-green">Payment History</h2>
                <p className="text-xs text-charcoal/50">View your payment records and receipts</p>
              </div>
            </div>
            <Link
              href="/account/payments"
              className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              View Payment History
            </Link>
          </section>

          {/* Notifications */}
          <section className="bg-white rounded-2xl border border-charcoal/8 p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green/10">
                <Bell size={18} className="text-forest-green" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-forest-green">Notifications</h2>
                <p className="text-xs text-charcoal/50">Manage your email preferences</p>
              </div>
            </div>
            <Link
              href="/account/notifications"
              className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              Manage Notifications
            </Link>
          </section>

          <ProfileSection />
          {!user.isGoogleLinked && (
            <section className="bg-white rounded-2xl border border-charcoal/8 p-6 lg:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green/10">
                  <Lock size={18} className="text-forest-green" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-forest-green">
                    Connect Google
                  </h2>
                  <p className="text-xs text-charcoal/50">
                    Link the Google account that uses this email address
                  </p>
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-charcoal/60">
                Use Google to sign in faster next time. Linking is only allowed
                when the verified Google email matches this account.
              </p>
              <GoogleSignInButton
                link
                next="/account"
                label="Connect Google account"
                onError={(message) => setLinkError(message || null)}
              />
            </section>
          )}
          {user.hasPassword && <ChangePasswordSection />}

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

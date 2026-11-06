"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Home,
  CheckCircle,
  AlertCircle,
  Mail,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import Button from "@/components/Button";
import {
  getEmailPreferences,
  updateEmailPreferences,
} from "@/services/paymentService";
import type { EmailPreference } from "@/types";

// ---------------------------------------------------------------------------
// Inner page
// ---------------------------------------------------------------------------

function NotificationsPage() {
  const [prefs, setPrefs] = useState<EmailPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [promotional, setPromotional] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEmailPreferences()
      .then((p) => {
        setPrefs(p);
        setPromotional(p.promotionalEmailsEnabled);
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load email preferences.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateEmailPreferences({
        promotionalEmailsEnabled: promotional,
      });
      setPrefs(updated);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update preferences.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8">
          <Link href="/" className="hover:text-forest-green transition-colors flex items-center gap-1">
            <Home size={12} />
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-forest-green transition-colors">
            My Account
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">Notifications</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/10">
            <Bell size={20} className="text-forest-green" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-green">
              Notifications
            </h1>
            <p className="text-sm text-charcoal/50">
              Manage your email communication preferences
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Essential emails */}
            <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 shrink-0">
                  <ShieldCheck size={20} className="text-green-600" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-semibold text-forest-green">
                        Essential Emails
                      </h2>
                      <p className="text-xs text-charcoal/50 mt-0.5">
                        Always enabled — cannot be turned off
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      Always On
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      "Booking confirmations and status updates",
                      "Payment receipts and refund notifications",
                      "Account security alerts",
                      "Password reset emails",
                    ].map((item) => (
                      <p
                        key={item}
                        className="flex items-center gap-2 text-sm text-charcoal/70"
                      >
                        <Mail size={13} className="text-forest-green/60 shrink-0" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Promotional emails */}
            <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-soft-gold/20 shrink-0">
                  <Megaphone size={20} className="text-soft-gold" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-semibold text-forest-green">
                        Promotional Emails
                      </h2>
                      <p className="text-xs text-charcoal/50 mt-0.5">
                        Deals, new properties, and travel inspiration
                      </p>
                    </div>
                    {/* Toggle */}
                    <button
                      role="switch"
                      aria-checked={promotional}
                      onClick={() => {
                        setPromotional((p) => !p);
                        setSuccess(false);
                      }}
                      className={[
                        "relative inline-flex w-11 h-6 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:ring-offset-2 shrink-0",
                        promotional ? "bg-forest-green" : "bg-charcoal/20",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform",
                          promotional ? "translate-x-6" : "translate-x-1",
                        ].join(" ")}
                      />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {[
                      "Exclusive deals and discounts",
                      "New apartment listings in your favourite cities",
                      "Travel tips and destination highlights",
                      "Seasonal promotions",
                    ].map((item) => (
                      <p
                        key={item}
                        className="flex items-center gap-2 text-sm text-charcoal/70"
                      >
                        <Mail size={13} className="text-soft-gold shrink-0" />
                        {item}
                      </p>
                    ))}
                  </div>

                  {prefs && (
                    <p className="mt-3 text-xs text-charcoal/40">
                      {prefs.consentGivenAt && promotional
                        ? `Subscribed since ${new Date(prefs.consentGivenAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                        : prefs.unsubscribedAt && !promotional
                          ? `Unsubscribed on ${new Date(prefs.unsubscribedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                          : null}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback */}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
                <CheckCircle size={15} />
                Preferences saved successfully.
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Save button */}
            <Button
              variant="primary"
              size="md"
              loading={saving}
              onClick={handleSave}
            >
              Save Preferences
            </Button>

            {/* Cookie policy link */}
            <p className="text-xs text-charcoal/40">
              For cookie preferences, visit our{" "}
              <Link
                href="/cookie-policy"
                className="underline hover:text-forest-green transition-colors"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPageWrapper() {
  return (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  );
}

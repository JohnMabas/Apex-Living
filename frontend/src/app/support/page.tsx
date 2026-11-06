"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Headphones, Loader2 } from "lucide-react";
import { createSupportTicket, type CreateSupportTicketData } from "@/services/supportService";
import type { SupportTicketCategory } from "@/types";

const categories: { value: SupportTicketCategory; label: string }[] = [
  { value: "BOOKING_ISSUE", label: "Booking issue" },
  { value: "PAYMENT_ISSUE", label: "Payment issue" },
  { value: "CANCELLATION", label: "Cancellation" },
  { value: "REFUND", label: "Refund" },
  { value: "APARTMENT_ISSUE", label: "Apartment issue" },
  { value: "GENERAL_ENQUIRY", label: "General enquiry" },
];

export default function SupportPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    bookingReference: "",
    category: "" as SupportTicketCategory | "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticketRef, setTicketRef] = useState("");

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const data: CreateSupportTicketData = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        bookingReference: form.bookingReference.trim() || undefined,
        category: form.category as SupportTicketCategory,
        subject: form.subject.trim(),
        message: form.message.trim(),
      };
      const result = await createSupportTicket(data);
      setTicketRef(result.ticket.ticketReference);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mx-auto mb-4">
            <CheckCircle2 size={30} className="text-green-600" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-forest-green mb-2">
            Support request sent
          </h1>
          <p className="text-sm text-charcoal/60 mb-2">
            Your ticket reference is:
          </p>
          <p className="text-lg font-mono font-semibold text-charcoal mb-4">
            {ticketRef}
          </p>
          <p className="text-sm text-charcoal/50 mb-6">
            We&apos;ve sent a confirmation to your email. Our team will respond
            within 24 hours.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-ivory pt-20 px-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-forest-green/10">
            <Headphones size={24} className="text-forest-green" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-green">
              Customer support
            </h1>
            <p className="text-sm text-charcoal/50">
              We&apos;re here to help — no account needed.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Booking reference (optional)
              </label>
              <input
                value={form.bookingReference}
                onChange={(e) => update("bookingReference", e.target.value)}
                placeholder="NEST-ABC123"
                className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => update("category", e.target.value as SupportTicketCategory)}
              className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              required
              maxLength={200}
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              maxLength={5000}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-3 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Submitting…" : "Submit support request"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-charcoal/40">
          For urgent matters, email{" "}
          <a href="mailto:hello@nestora.ng" className="underline hover:text-forest-green">
            hello@nestora.ng
          </a>
        </p>
      </div>
    </div>
  );
}

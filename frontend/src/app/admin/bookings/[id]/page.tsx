"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Tag,
  Users,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { adminChangeBookingStatus, getAdminBooking } from "@/services/bookingService";
import type { Booking, BookingStatus } from "@/types";
import { formatDate, formatPrice, formatShortDate } from "@/lib/format";

const ALLOWED_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELLED", "EXPIRED", "DECLINED"],
  AWAITING_PAYMENT: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-2.5 text-sm last:border-b-0">
      <span className="text-charcoal/50 shrink-0">{label}</span>
      <span className="text-right font-medium text-charcoal">{value}</span>
    </div>
  );
}

function AdminBookingDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    getAdminBooking(params.id)
      .then((b) => { if (!cancelled) setBooking(b); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Not found."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  async function handleStatusChange() {
    if (!booking || !newStatus) return;
    setActionError(null);
    setMessage(null);
    setBusy(true);
    try {
      const updated = await adminChangeBookingStatus(booking.id, newStatus, note.trim() || undefined);
      setBooking(updated);
      setNewStatus("");
      setNote("");
      setMessage(`Status updated to ${newStatus}.`);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green/30 border-t-forest-green" />
    </div>
  );

  if (error || !booking) return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <p className="font-display text-xl font-semibold text-forest-green mb-2">Booking unavailable</p>
      <p className="text-sm text-charcoal/60">{error ?? "Not found."}</p>
      <Link href="/admin/bookings" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors">
        <ArrowLeft size={15} /> Back to bookings
      </Link>
    </div>
  );

  const transitions = ALLOWED_TRANSITIONS[booking.status] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors">
          <ArrowLeft size={14} /> Booking management
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-forest-green">Booking Detail</h1>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal/60">
          <Tag size={13} className="text-soft-gold" /> {booking.bookingReference}
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      )}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      {booking.cancellationReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={15} /> {booking.status}
          </p>
          <p className="mt-1.5 text-sm text-red-700/80">{booking.cancellationReason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Apartment + Stay */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-1">{booking.apartment.title}</h2>
            <p className="flex items-center gap-1.5 text-sm text-charcoal/60 mb-4">
              <MapPin size={13} className="text-soft-gold" /> {booking.apartment.location}, {booking.apartment.city}
            </p>
            <div className="divide-y divide-charcoal/8">
              <DetailRow label="Check-in" value={<span className="flex items-center gap-1.5 justify-end"><CalendarDays size={14} className="text-soft-gold" />{formatShortDate(booking.checkIn)}</span>} />
              <DetailRow label="Check-out" value={<span className="flex items-center gap-1.5 justify-end"><CalendarDays size={14} className="text-soft-gold" />{formatShortDate(booking.checkOut)}</span>} />
              <DetailRow label="Nights" value={booking.numberOfNights} />
              <DetailRow label="Guests" value={<span className="flex items-center gap-1.5 justify-end"><Users size={14} className="text-soft-gold" />{booking.numberOfGuests}</span>} />
            </div>
          </section>

          {/* Guest */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Guest</h2>
            <p className="font-medium text-charcoal">{booking.guest.fullName}</p>
            <div className="mt-2 space-y-1.5">
              {booking.guest.email && (
                <a href={`mailto:${booking.guest.email}`} className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green">
                  <Mail size={14} /> {booking.guest.email}
                </a>
              )}
              {booking.guest.phone && (
                <a href={`tel:${booking.guest.phone}`} className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green">
                  <Phone size={14} /> {booking.guest.phone}
                </a>
              )}
            </div>
          </section>

          {/* Status history */}
          {booking.statusHistory.length > 0 && (
            <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Audit Trail</h2>
              <ol className="space-y-3">
                {booking.statusHistory.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 rounded-full bg-forest-green/40 shrink-0" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <BookingStatusBadge status={entry.status} />
                        {entry.changedBy && <span className="text-xs text-charcoal/50">by {entry.changedBy.fullName}</span>}
                        <span className="text-xs text-charcoal/40">{formatDate(entry.createdAt)}</span>
                      </div>
                      {entry.note && <p className="mt-0.5 text-xs text-charcoal/60">{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Admin action */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Admin Action</h2>
            {transitions.length === 0 ? (
              <p className="text-sm text-charcoal/50 rounded-lg bg-warm-ivory px-3 py-2.5">
                No transitions available for {booking.status.toLowerCase()} bookings.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="new-status" className="block text-xs font-medium text-charcoal/60 mb-1.5">
                    Change status to
                  </label>
                  <select
                    id="new-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as BookingStatus | "")}
                    className="w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2.5 text-sm text-charcoal focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
                  >
                    <option value="">Select new status…</option>
                    {transitions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add an admin note (optional)…"
                  className="w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
                />
                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={!newStatus || busy}
                  className="w-full rounded-lg bg-forest-green px-4 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 disabled:opacity-50 transition-colors"
                >
                  {busy ? "Saving…" : "Apply Status Change"}
                </button>
              </div>
            )}
          </section>

          {/* Price */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Price</h2>
            <div className="divide-y divide-charcoal/8 text-sm">
              <div className="flex justify-between py-2.5 text-charcoal/70">
                <span>{formatPrice(booking.nightlyPriceSnapshot)} × {booking.numberOfNights}n</span>
                <span>{formatPrice(booking.accommodationSubtotal)}</span>
              </div>
              {booking.cleaningFeeSnapshot !== null && (
                <div className="flex justify-between py-2.5 text-charcoal/70">
                  <span>Cleaning</span><span>{formatPrice(booking.cleaningFeeSnapshot)}</span>
                </div>
              )}
              {booking.additionalFeesSnapshot !== null && (
                <div className="flex justify-between py-2.5 text-charcoal/70">
                  <span>Extra fees</span><span>{formatPrice(booking.additionalFeesSnapshot)}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 font-semibold text-charcoal">
                <span>Total</span>
                <span className="text-forest-green">{formatPrice(booking.totalAmount)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm text-sm space-y-1">
            <DetailRow label="Reference" value={<span className="font-mono text-xs">{booking.bookingReference}</span>} />
            <DetailRow label="Created" value={formatShortDate(booking.createdAt)} />
            {booking.expiresAt && booking.status === "PENDING" && (
              <DetailRow label="Expires" value={<span className="text-amber-600">{formatDate(booking.expiresAt)}</span>} />
            )}
            {booking.adminNotes && (
              <DetailRow label="Admin note" value={booking.adminNotes} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingDetailPage() {
  return (
    <RequireAuth adminOnly>
      <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AdminBookingDetail />
        </div>
      </div>
    </RequireAuth>
  );
}

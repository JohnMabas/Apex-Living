"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Tag,
  Users,
  XCircle,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { acceptHostBooking, declineHostBooking, getHostBooking } from "@/services/bookingService";
import type { Booking } from "@/types";
import { formatDate, formatPrice, formatShortDate } from "@/lib/format";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-2.5 text-sm last:border-b-0">
      <span className="text-charcoal/50 shrink-0">{label}</span>
      <span className="text-right font-medium text-charcoal">{value}</span>
    </div>
  );
}

function HostBookingDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    getHostBooking(params.id)
      .then((b) => { if (!cancelled) setBooking(b); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Not found."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  async function handleAccept() {
    if (!booking) return;
    setActionError(null);
    setBusy("accept");
    try {
      const updated = await acceptHostBooking(booking.id);
      setBooking(updated);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not accept.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDecline() {
    if (!booking) return;
    if (declineReason.trim().length < 3) {
      setActionError("Please provide a reason.");
      return;
    }
    setActionError(null);
    setBusy("decline");
    try {
      const updated = await declineHostBooking(booking.id, declineReason.trim());
      setBooking(updated);
      setShowDecline(false);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not decline.");
    } finally {
      setBusy(null);
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
      <Link href="/host/bookings" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors">
        <ArrowLeft size={15} /> Back to reservations
      </Link>
    </div>
  );

  const isPending = booking.status === "PENDING";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/host/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors">
            <ArrowLeft size={14} /> Reservations
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-forest-green">Reservation Detail</h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal/60">
            <Tag size={13} className="text-soft-gold" /> {booking.bookingReference}
          </p>
        </div>

        {/* Host actions for PENDING */}
        {isPending && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAccept}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-4 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 size={15} />
              {busy === "accept" ? "Accepting…" : "Accept Booking"}
            </button>
            <button
              type="button"
              onClick={() => { setShowDecline(true); setActionError(null); }}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle size={15} /> Decline
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {showDecline && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700 mb-3">Decline this booking?</p>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
            placeholder="Please tell the guest why you're declining…"
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleDecline} disabled={busy !== null}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {busy === "decline" ? "Declining…" : "Decline Booking"}
            </button>
            <button type="button" onClick={() => { setShowDecline(false); setDeclineReason(""); }}
              className="rounded-lg border border-charcoal/20 bg-white px-4 py-2 text-sm text-charcoal/60 hover:bg-charcoal/5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {booking.status === "CANCELLED" && booking.cancellationReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={15} /> Cancelled
          </p>
          <p className="mt-1.5 text-sm text-red-700/80">{booking.cancellationReason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Stay details */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-1">
              {booking.apartment.title}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-charcoal/60 mb-4">
              <MapPin size={13} className="text-soft-gold" />
              {booking.apartment.location}, {booking.apartment.city}
            </p>
            <div className="divide-y divide-charcoal/8">
              <DetailRow label="Check-in" value={
                <span className="flex items-center gap-1.5 justify-end">
                  <CalendarDays size={14} className="text-soft-gold" />
                  {formatShortDate(booking.checkIn)}
                </span>
              } />
              <DetailRow label="Check-out" value={
                <span className="flex items-center gap-1.5 justify-end">
                  <CalendarDays size={14} className="text-soft-gold" />
                  {formatShortDate(booking.checkOut)}
                </span>
              } />
              <DetailRow label="Nights" value={booking.numberOfNights} />
              <DetailRow label="Guests" value={
                <span className="flex items-center gap-1.5 justify-end">
                  <Users size={14} className="text-soft-gold" /> {booking.numberOfGuests}
                </span>
              } />
            </div>
          </section>

          {/* Guest info */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Guest</h2>
            <p className="font-medium text-charcoal">{booking.guest.fullName}</p>
            <div className="mt-2 space-y-1.5">
              {booking.guest.email && (
                <a href={`mailto:${booking.guest.email}`} className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors">
                  <Mail size={14} /> {booking.guest.email}
                </a>
              )}
              {booking.guest.phone && (
                <a href={`tel:${booking.guest.phone}`} className="flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors">
                  <Phone size={14} /> {booking.guest.phone}
                </a>
              )}
            </div>
          </section>
        </div>

        {/* Price */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Price</h2>
            <div className="divide-y divide-charcoal/8 text-sm">
              <div className="flex justify-between py-2.5 text-charcoal/70">
                <span>{formatPrice(booking.nightlyPriceSnapshot)} × {booking.numberOfNights} nights</span>
                <span>{formatPrice(booking.accommodationSubtotal)}</span>
              </div>
              {booking.cleaningFeeSnapshot !== null && (
                <div className="flex justify-between py-2.5 text-charcoal/70">
                  <span>Cleaning fee</span>
                  <span>{formatPrice(booking.cleaningFeeSnapshot)}</span>
                </div>
              )}
              {booking.additionalFeesSnapshot !== null && (
                <div className="flex justify-between py-2.5 text-charcoal/70">
                  <span>Additional fees</span>
                  <span>{formatPrice(booking.additionalFeesSnapshot)}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 font-semibold text-charcoal">
                <span>Total</span>
                <span className="text-forest-green">{formatPrice(booking.totalAmount)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm text-sm space-y-2">
            <DetailRow label="Reference" value={<span className="font-mono text-xs">{booking.bookingReference}</span>} />
            <DetailRow label="Booked" value={formatShortDate(booking.createdAt)} />
            {booking.expiresAt && booking.status === "PENDING" && (
              <DetailRow label="Expires" value={<span className="text-amber-600">{formatDate(booking.expiresAt)}</span>} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function HostBookingDetailPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <HostBookingDetail />
        </div>
      </div>
    </RequireAuth>
  );
}

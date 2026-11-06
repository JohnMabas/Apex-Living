"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Home,
  MapPin,
  Tag,
  Users,
  X,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { cancelMyBooking, getMyBooking } from "@/services/bookingService";
import type { Booking } from "@/types";
import { formatPrice, formatDate, formatShortDate, resolveMediaUrl } from "@/lib/format";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-2.5 text-sm last:border-b-0">
      <span className="text-charcoal/50 shrink-0">{label}</span>
      <span className="text-right font-medium text-charcoal">{value}</span>
    </div>
  );
}

function GuestBookingDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    getMyBooking(params.id)
      .then((b) => { if (!cancelled) setBooking(b); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load booking.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  async function handleCancel() {
    if (!booking) return;
    if (cancelReason.trim().length < 3) {
      setCancelError("Please provide a reason.");
      return;
    }
    setCancelError(null);
    setCancelling(true);
    try {
      const updated = await cancelMyBooking(booking.id, cancelReason.trim());
      setBooking(updated);
      setShowCancel(false);
      router.refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green/30 border-t-forest-green" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="font-display text-xl font-semibold text-forest-green mb-2">Booking unavailable</p>
        <p className="text-sm text-charcoal/60">{error ?? "This booking could not be found."}</p>
        <Link href="/account/bookings" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors">
          <ArrowLeft size={15} /> Back to my bookings
        </Link>
      </div>
    );
  }

  const imgUrl = resolveMediaUrl(booking.apartment.mainImage);
  const canCancel = ["PENDING", "AWAITING_PAYMENT", "CONFIRMED"].includes(booking.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/account/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors">
            <ArrowLeft size={14} /> My bookings
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-forest-green">
              Booking Details
            </h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal/60">
            <Tag size={13} className="text-soft-gold" />
            {booking.bookingReference}
          </p>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancel(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <X size={15} /> Cancel Booking
          </button>
        )}
      </div>

      {/* Cancel panel */}
      {showCancel && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700 mb-3">Cancel this booking?</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            placeholder="Please tell us why you're cancelling…"
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
          {cancelError && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} /> {cancelError}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {cancelling ? "Cancelling…" : "Yes, Cancel Booking"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCancel(false); setCancelReason(""); setCancelError(null); }}
              className="rounded-lg border border-charcoal/20 bg-white px-4 py-2 text-sm text-charcoal/60 hover:bg-charcoal/5"
            >
              Keep Booking
            </button>
          </div>
        </div>
      )}

      {/* Cancellation info */}
      {booking.status === "CANCELLED" && booking.cancellationReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle size={15} /> Booking cancelled
          </p>
          <p className="mt-1.5 text-sm text-red-700/80">{booking.cancellationReason}</p>
          {booking.cancelledAt && (
            <p className="mt-1 text-xs text-red-600/60">Cancelled on {formatDate(booking.cancelledAt)}</p>
          )}
        </div>
      )}

      {/* Expiry warning for PENDING */}
      {booking.status === "PENDING" && booking.expiresAt && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-2">
            <CalendarDays size={15} /> Pending confirmation
          </p>
          <p className="mt-1.5 text-sm text-amber-700/80">
            This booking will expire at {formatDate(booking.expiresAt)} unless confirmed.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Apartment */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-forest-green/5 shrink-0">
                {imgUrl ? (
                  <Image src={imgUrl} alt={booking.apartment.title} fill unoptimized className="object-cover" sizes="96px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Home size={20} className="text-forest-green/20" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <Link href={`/apartments/${booking.apartment.id}`} className="font-display text-lg font-semibold text-forest-green hover:text-soft-gold transition-colors">
                  {booking.apartment.title}
                </Link>
                <p className="flex items-center gap-1.5 text-sm text-charcoal/60 mt-1">
                  <MapPin size={13} className="text-soft-gold" />
                  {booking.apartment.location}, {booking.apartment.city}
                </p>
              </div>
            </div>
          </section>

          {/* Stay details */}
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Stay Details</h2>
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
                  <Users size={14} className="text-soft-gold" />
                  {booking.numberOfGuests}
                </span>
              } />
              <DetailRow label="Check-in info" value={booking.apartment.checkInInfo} />
              <DetailRow label="Check-out info" value={booking.apartment.checkOutInfo} />
            </div>
          </section>

          {/* Status history */}
          {booking.statusHistory.length > 0 && (
            <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Activity</h2>
              <ol className="space-y-3">
                {booking.statusHistory.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 rounded-full bg-forest-green/40 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <BookingStatusBadge status={entry.status} />
                        <span className="text-xs text-charcoal/40">{formatDate(entry.createdAt)}</span>
                      </div>
                      {entry.note && (
                        <p className="mt-0.5 text-charcoal/60 text-xs">{entry.note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Price summary */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">Price Summary</h2>
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
            <DetailRow label="Booked on" value={formatShortDate(booking.createdAt)} />
            <DetailRow label="Currency" value={booking.currency} />
          </section>
        </div>
      </div>
    </div>
  );
}

export default function GuestBookingDetailPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <GuestBookingDetail />
        </div>
      </div>
    </RequireAuth>
  );
}

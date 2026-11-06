"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  CalendarDays,
  Users,
  Moon,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import Button from "@/components/Button";
import { getMyBooking } from "@/services/bookingService";
import { initializePayment } from "@/services/paymentService";
import { formatPrice, formatShortDate, resolveMediaUrl } from "@/lib/format";
import type { Booking } from "@/types";

// ---------------------------------------------------------------------------
// Inner component (has access to auth context via RequireAuth wrapper)
// ---------------------------------------------------------------------------

function PayPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    getMyBooking(bookingId)
      .then((b) => {
        if (!cancelled) setBooking(b);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load booking.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setPayError(null);
    try {
      const result = await initializePayment(booking.id);
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setPayError(
        err instanceof Error ? err.message : "Failed to initialize payment.",
      );
      setPaying(false);
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
      </div>
    );
  }

  // ---------- Error ----------
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-4">
            <AlertCircle size={26} className="text-red-500" />
          </span>
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Booking not found
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            {error ?? "We could not load this booking."}
          </p>
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Already confirmed ----------
  if (booking.status === "CONFIRMED" || booking.status === "ACTIVE" || booking.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 mx-auto mb-4">
            <CheckCircle size={26} className="text-green-600" />
          </span>
          <h1 className="font-display text-xl font-semibold text-forest-green mb-2">
            Booking Already Confirmed
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            This booking has already been paid and confirmed.
          </p>
          <Link
            href={`/account/bookings/${booking.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            View Booking
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Cancelled or expired ----------
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED" || booking.status === "DECLINED") {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-4">
            <AlertCircle size={26} className="text-red-500" />
          </span>
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Booking Unavailable
          </h1>
          <p className="text-sm text-charcoal/60 mb-2">
            This booking is{" "}
            <span className="font-medium">{booking.status.toLowerCase()}</span>{" "}
            and cannot be paid for.
          </p>
          {booking.cancellationReason && (
            <p className="text-sm text-charcoal/50 mb-6">
              Reason: {booking.cancellationReason}
            </p>
          )}
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            <ArrowLeft size={15} />
            My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const apt = booking.apartment;
  const imageUrl = resolveMediaUrl(apt.mainImage);

  const accommodationTotal = booking.accommodationSubtotal;
  const cleaningFee = booking.cleaningFeeSnapshot ?? 0;
  const additionalFees = booking.additionalFeesSnapshot ?? 0;
  const total = booking.totalAmount;

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8">
          <Link href="/" className="hover:text-forest-green transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/account/bookings"
            className="hover:text-forest-green transition-colors"
          >
            My Bookings
          </Link>
          <span>/</span>
          <Link
            href={`/account/bookings/${booking.id}`}
            className="hover:text-forest-green transition-colors"
          >
            {booking.bookingReference}
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">Pay</span>
        </nav>

        <h1 className="font-display text-2xl font-semibold text-forest-green mb-8">
          Complete Your Payment
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Booking summary */}
          <div className="lg:col-span-3 space-y-6">
            {/* Apartment card */}
            <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm overflow-hidden">
              {imageUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={imageUrl}
                    alt={apt.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="font-display text-lg font-semibold text-forest-green mb-1">
                  {apt.title}
                </h2>
                <p className="flex items-center gap-1.5 text-sm text-charcoal/60 mb-4">
                  <MapPin size={14} className="text-soft-gold shrink-0" />
                  {apt.location}, {apt.city}
                </p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-charcoal/8">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs text-charcoal/50">
                      <CalendarDays size={12} />
                      Check-in
                    </span>
                    <span className="text-sm font-medium text-charcoal">
                      {formatShortDate(booking.checkIn)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs text-charcoal/50">
                      <CalendarDays size={12} />
                      Check-out
                    </span>
                    <span className="text-sm font-medium text-charcoal">
                      {formatShortDate(booking.checkOut)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs text-charcoal/50">
                      <Users size={12} />
                      Guests
                    </span>
                    <span className="text-sm font-medium text-charcoal">
                      {booking.numberOfGuests}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 text-xs text-charcoal/50">
                  <Moon size={12} />
                  {booking.numberOfNights}{" "}
                  {booking.numberOfNights === 1 ? "night" : "nights"}
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
              <h3 className="font-display text-base font-semibold text-forest-green mb-4">
                Price Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/70">
                    {formatPrice(booking.nightlyPriceSnapshot)} ×{" "}
                    {booking.numberOfNights}{" "}
                    {booking.numberOfNights === 1 ? "night" : "nights"}
                  </span>
                  <span className="text-charcoal font-medium">
                    {formatPrice(accommodationTotal)}
                  </span>
                </div>

                {cleaningFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal/70">Cleaning fee</span>
                    <span className="text-charcoal font-medium">
                      {formatPrice(cleaningFee)}
                    </span>
                  </div>
                )}

                {additionalFees > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal/70">Additional fees</span>
                    <span className="text-charcoal font-medium">
                      {formatPrice(additionalFees)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-charcoal/8">
                  <span className="text-sm font-semibold text-charcoal">
                    Total
                  </span>
                  <span className="text-base font-bold text-forest-green">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment action */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-forest-green/10">
                  <CreditCard size={18} className="text-forest-green" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-forest-green">
                    Secure Payment
                  </h3>
                  <p className="text-xs text-charcoal/50">Powered by Paystack</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 pb-4 border-b border-charcoal/8">
                <span className="text-sm text-charcoal/70">Amount due</span>
                <span className="text-xl font-bold text-forest-green">
                  {formatPrice(total)}
                </span>
              </div>

              {payError && (
                <div
                  role="alert"
                  className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
                >
                  {payError}
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handlePay}
                loading={paying}
                disabled={paying}
              >
                {paying ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <CreditCard size={15} />
                    Pay Now
                  </>
                )}
              </Button>

              <p className="mt-4 text-xs text-charcoal/50 text-center leading-relaxed">
                By paying you agree to our{" "}
                <Link
                  href="/refund-policy"
                  className="underline hover:text-forest-green transition-colors"
                >
                  Refund Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-forest-green transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              <div className="mt-5 pt-4 border-t border-charcoal/8">
                <p className="text-xs text-charcoal/40 text-center">
                  🔒 Your payment is encrypted and secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export wrapped in RequireAuth
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <PayPage />
    </RequireAuth>
  );
}

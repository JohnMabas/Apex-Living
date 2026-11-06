"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ReceiptText,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { verifyPayment } from "@/services/paymentService";
import type { Payment } from "@/types";

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be wrapped in Suspense)
// ---------------------------------------------------------------------------

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? "";

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError("No payment reference found in URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    verifyPayment(reference)
      .then((p) => {
        if (!cancelled) setPayment(p);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to verify payment.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
        <p className="text-sm text-charcoal/60">Verifying your payment…</p>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-4">
            <AlertCircle size={30} className="text-red-500" />
          </span>
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Verification Failed
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">{error}</p>
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const status = payment?.status ?? "FAILED";
  const bookingId = payment?.booking?.bookingReference;

  // ---------- SUCCESS ----------
  if (status === "SUCCESS") {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mx-auto mb-4">
            <CheckCircle size={30} className="text-green-600" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-forest-green mb-2">
            Payment Successful!
          </h1>
          <p className="text-sm text-charcoal/60 mb-1">
            Your booking has been confirmed.
          </p>
          {payment?.booking && (
            <p className="text-xs text-charcoal/40 mb-6">
              Apartment:{" "}
              <span className="font-medium text-charcoal/70">
                {payment.booking.apartment.title}
              </span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            {bookingId && (
              <Link
                href={`/account/bookings?ref=${encodeURIComponent(bookingId)}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
              >
                <CalendarDays size={15} />
                View Booking
              </Link>
            )}
            {payment && (
              <Link
                href={`/account/payments/${encodeURIComponent(payment.paymentReference)}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest-green/20 px-5 py-2.5 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
              >
                <ReceiptText size={15} />
                View Receipt
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- PENDING ----------
  if (status === "PENDING" || status === "INITIALIZED") {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 mx-auto mb-4">
            <Clock size={30} className="text-amber-500" />
          </span>
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Payment Processing
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            Your payment is being processed. This can take a few minutes. Please
            check back shortly or view your bookings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              <CalendarDays size={15} />
              My Bookings
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal/20 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
            >
              <RefreshCw size={15} />
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- FAILED / ABANDONED / everything else ----------
  return (
    <div className="min-h-screen bg-warm-ivory pt-24 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
        <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-4">
          <XCircle size={30} className="text-red-500" />
        </span>
        <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
          Payment{" "}
          {status === "ABANDONED" ? "Abandoned" : "Failed"}
        </h1>
        <p className="text-sm text-charcoal/60 mb-2">
          {payment?.failureReason ??
            "The payment could not be completed. Please try again."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href="/account/bookings"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal/20 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export with Suspense boundary
// ---------------------------------------------------------------------------

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}

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
import {
  downloadGuestReceipt,
  verifyGuestPayment,
  verifyPayment,
} from "@/services/paymentService";
import { getPaymentToken } from "@/lib/guestBooking";
import type { Payment } from "@/types";

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be wrapped in Suspense)
// ---------------------------------------------------------------------------

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? "";
  const queryToken = searchParams.get("token") ?? "";
  const guestHint = searchParams.get("guest") === "1";

  const [storedToken, setStoredToken] = useState("");
  const [storageChecked, setStorageChecked] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const token = queryToken || storedToken;
  const isGuest = guestHint || Boolean(token);

  useEffect(() => {
    if (!reference) {
      setStorageChecked(true);
      return;
    }
    setStoredToken(getPaymentToken(reference) ?? "");
    setStorageChecked(true);
  }, [reference]);

  useEffect(() => {
    if (!storageChecked) return;

    if (!reference) {
      setError("No payment reference found in URL.");
      setLoading(false);
      return;
    }

    if (isGuest && !token) {
      setError(
        "Your secure booking link is missing. Open the link from your confirmation email to view this booking.",
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    const verification = isGuest
      ? verifyGuestPayment(reference, token)
      : verifyPayment(reference);

    verification
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
  }, [reference, token, isGuest, storageChecked]);

  async function handleDownloadReceipt() {
    if (!payment) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await downloadGuestReceipt(
        payment.paymentReference,
        token,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Nestora-Receipt-${payment.booking?.bookingReference ?? payment.paymentReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Could not download your receipt.",
      );
    } finally {
      setDownloading(false);
    }
  }

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
            href={isGuest ? "/bookings/manage" : "/account/bookings"}
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            {isGuest ? "Find My Booking" : "My Bookings"}
          </Link>
        </div>
      </div>
    );
  }

  const status = payment?.status ?? "FAILED";
  const bookingReference = payment?.booking?.bookingReference;
  const accountBookingUrl = bookingReference
    ? `/account/bookings?ref=${encodeURIComponent(bookingReference)}`
    : "/account/bookings";
  const guestBookingUrl =
    bookingReference && token
      ? `/bookings/manage/${encodeURIComponent(
          bookingReference,
        )}?token=${encodeURIComponent(token)}`
      : "/bookings/manage";
  const bookingUrl = isGuest ? guestBookingUrl : accountBookingUrl;

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
            <Link
              href={bookingUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              <CalendarDays size={15} />
              View Booking
            </Link>
            {payment &&
              (isGuest ? (
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={downloading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest-green/20 px-5 py-2.5 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors disabled:opacity-50"
                >
                  {downloading ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <ReceiptText size={15} />
                  )}
                  {downloading ? "Preparing…" : "Download Receipt"}
                </button>
              ) : (
                <Link
                  href={`/account/payments/${encodeURIComponent(payment.paymentReference)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest-green/20 px-5 py-2.5 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
                >
                  <ReceiptText size={15} />
                  View Receipt
                </Link>
              ))}
          </div>
          {downloadError && (
            <p className="mt-4 text-xs text-red-600">{downloadError}</p>
          )}
          {isGuest && (
            <p className="mt-5 text-xs text-charcoal/40">
              A PDF receipt is also attached to your confirmation email. Keep
              your secure booking link safe.
            </p>
          )}
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
              href={bookingUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              <CalendarDays size={15} />
              {isGuest ? "View Booking" : "My Bookings"}
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
            href={bookingUrl}
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

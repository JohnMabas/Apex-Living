"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ReceiptText,
  CheckCircle,
  Printer,
  CalendarDays,
  MapPin,
  Home,
  AlertCircle,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { getMyPayment } from "@/services/paymentService";
import { formatPrice, formatShortDate } from "@/lib/format";
import type { Payment } from "@/types";

// ---------------------------------------------------------------------------
// Inner receipt page
// ---------------------------------------------------------------------------

function ReceiptPage() {
  const params = useParams<{ reference: string }>();
  const reference = decodeURIComponent(params.reference ?? "");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError("Invalid reference.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    getMyPayment(reference)
      .then((p) => {
        if (!cancelled) setPayment(p);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load receipt.",
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
      <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-4">
            <AlertCircle size={26} className="text-red-500" />
          </span>
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Receipt Not Found
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            {error ?? "We could not find this payment."}
          </p>
          <Link
            href="/account/payments"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            Payment History
          </Link>
        </div>
      </div>
    );
  }

  if (payment.status !== "SUCCESS") {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Receipt Unavailable
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            Receipts are only available for successful payments. This payment
            status is{" "}
            <span className="font-medium">{payment.status.toLowerCase()}</span>.
          </p>
          <Link
            href="/account/payments"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            Payment History
          </Link>
        </div>
      </div>
    );
  }

  const apt = payment.booking?.apartment;

  return (
    <div className="min-h-screen bg-warm-ivory pt-20 print:bg-white print:pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 print:px-0 print:py-0">
        {/* Breadcrumb — hidden on print */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8 print:hidden">
          <Link href="/" className="hover:text-forest-green transition-colors flex items-center gap-1">
            <Home size={12} />
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-forest-green transition-colors">
            Account
          </Link>
          <span>/</span>
          <Link href="/account/payments" className="hover:text-forest-green transition-colors">
            Payments
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">Receipt</span>
        </nav>

        {/* Receipt card */}
        <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Header */}
          <div className="bg-forest-green text-warm-ivory p-8 text-center print:p-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-warm-ivory/10 mx-auto mb-4">
              <ReceiptText size={26} />
            </div>
            <p className="text-warm-ivory/70 text-sm mb-1">Payment Receipt</p>
            <h1 className="font-display text-2xl font-semibold">Nestora</h1>
            <p className="text-warm-ivory/60 text-xs mt-1">
              Your comfort, your space.
            </p>
          </div>

          {/* Confirmed badge */}
          <div className="flex items-center justify-center gap-2 py-4 bg-green-50 border-b border-green-100">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Payment Confirmed
            </span>
          </div>

          <div className="p-8 print:p-6 space-y-6">
            {/* Reference */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-charcoal/50 mb-1">
                  Payment Reference
                </p>
                <p className="font-mono text-sm font-medium text-charcoal break-all">
                  {payment.paymentReference}
                </p>
              </div>
              {payment.paystackReference && (
                <div>
                  <p className="text-xs text-charcoal/50 mb-1">
                    Paystack Reference
                  </p>
                  <p className="font-mono text-sm font-medium text-charcoal break-all">
                    {payment.paystackReference}
                  </p>
                </div>
              )}
            </div>

            {/* Booking details */}
            {apt && (
              <div className="pt-4 border-t border-charcoal/8">
                <p className="text-xs text-charcoal/50 mb-3 uppercase tracking-wider">
                  Booking Details
                </p>
                <div className="space-y-2">
                  <p className="flex items-start gap-2 text-sm text-charcoal">
                    <Home size={14} className="text-soft-gold mt-0.5 shrink-0" />
                    <span>
                      <span className="font-medium">{apt.title}</span>
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-charcoal/70">
                    <MapPin size={14} className="text-soft-gold shrink-0" />
                    {apt.location}, {apt.city}
                  </p>
                  {payment.booking?.bookingReference && (
                    <p className="flex items-center gap-2 text-sm text-charcoal/70">
                      <CalendarDays size={14} className="text-soft-gold shrink-0" />
                      Booking ref:{" "}
                      <span className="font-mono font-medium text-charcoal">
                        {payment.booking.bookingReference}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment details */}
            <div className="pt-4 border-t border-charcoal/8">
              <p className="text-xs text-charcoal/50 mb-3 uppercase tracking-wider">
                Payment Details
              </p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/70">Amount Paid</span>
                  <span className="font-bold text-base text-forest-green">
                    {formatPrice(payment.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/70">Currency</span>
                  <span className="text-charcoal">{payment.currency}</span>
                </div>
                {payment.paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-charcoal/70">Method</span>
                    <span className="text-charcoal capitalize">
                      {payment.paymentMethod}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/70">Paid At</span>
                  <span className="text-charcoal">
                    {formatShortDate(payment.paidAt ?? payment.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-4 border-t border-charcoal/8 text-center">
              <p className="text-xs text-charcoal/40">
                Thank you for choosing Nestora. For questions, contact{" "}
                <a
                  href="mailto:hello@nestora.ng"
                  className="underline hover:text-forest-green transition-colors"
                >
                  hello@nestora.ng
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Actions — hidden on print */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal/20 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
          >
            <Printer size={15} />
            Print Receipt
          </button>

          {payment.booking?.bookingReference && (
            <Link
              href="/account/bookings"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              <CalendarDays size={15} />
              View Booking
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentReceiptPage() {
  return (
    <RequireAuth>
      <ReceiptPage />
    </RequireAuth>
  );
}

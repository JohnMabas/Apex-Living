"use client";

import Link from "next/link";
import { XCircle, CalendarDays, Mail } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-warm-ivory pt-24 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
        <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-4">
          <XCircle size={30} className="text-red-500" />
        </span>

        <h1 className="font-display text-2xl font-semibold text-charcoal mb-2">
          Payment Failed
        </h1>
        <p className="text-sm text-charcoal/60 mb-6 leading-relaxed">
          We were unable to complete your payment. This may be due to
          insufficient funds, a declined card, or a network issue. Please try
          again or use a different payment method.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/bookings/manage"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            <CalendarDays size={15} />
            Find My Booking — Try Again
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal/20 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
          >
            <Mail size={15} />
            Contact Support
          </Link>
        </div>

        <p className="mt-6 text-xs text-charcoal/40">
          If you were charged but your booking is not confirmed, please email{" "}
          <a
            href="mailto:hello@nestora.ng"
            className="underline hover:text-forest-green transition-colors"
          >
            hello@nestora.ng
          </a>
          .
        </p>
      </div>
    </div>
  );
}

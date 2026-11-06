import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Nestora's refund and cancellation policy. Understand your rights when cancelling a booking.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8">
          <Link href="/" className="hover:text-forest-green transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">Refund Policy</span>
        </nav>

        <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 sm:p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-charcoal/8">
            <h1 className="font-display text-3xl font-semibold text-forest-green mb-2">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-sm text-charcoal/50">
              Policy version 1.0 &mdash; Effective 1 November 2025
            </p>
          </div>

          {/* Introduction */}
          <p className="text-charcoal/70 mb-8 leading-relaxed">
            At Nestora, we aim to make every booking as straightforward as
            possible. This policy explains when you may cancel a booking and
            whether you are entitled to a refund. Please read it carefully
            before making a reservation.
          </p>

          {/* Cancellation rules by status */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              Cancellation Rules by Booking Status
            </h2>

            <div className="space-y-4">
              {/* PENDING */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    PENDING
                  </span>
                </div>
                <p className="text-sm text-charcoal/70 leading-relaxed">
                  A booking in <strong>PENDING</strong> status has been created
                  but not yet accepted by the host. You may cancel at any time
                  before the host accepts the booking at{" "}
                  <strong>no charge</strong>. No payment has been collected at
                  this stage.
                </p>
              </div>

              {/* AWAITING_PAYMENT */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    AWAITING PAYMENT
                  </span>
                </div>
                <p className="text-sm text-charcoal/70 leading-relaxed">
                  The host has accepted your booking and payment is expected.
                  You may still cancel at this point at{" "}
                  <strong>no charge</strong> since no payment has been
                  collected. Cancelling will release the booking and make the
                  dates available to other guests.
                </p>
              </div>

              {/* CONFIRMED */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    CONFIRMED
                  </span>
                </div>
                <p className="text-sm text-charcoal/70 leading-relaxed mb-2">
                  Your booking is confirmed and payment has been received.
                </p>
                <ul className="space-y-1.5 text-sm text-charcoal/70 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>
                      <strong>Within 48 hours of confirmation:</strong> Full
                      refund. We will process your refund within 5–10 business
                      days.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span>
                    <span>
                      <strong>After 48 hours:</strong> No refund is available.
                      The booking amount is non-refundable.
                    </span>
                  </li>
                </ul>
              </div>

              {/* ACTIVE */}
              <div className="rounded-xl border border-charcoal/8 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest-green/10 text-forest-green border border-forest-green/10">
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-charcoal/70 leading-relaxed">
                  Your stay is in progress. <strong>No refund</strong> is
                  available once an active stay has begun.
                </p>
              </div>
            </div>
          </section>

          {/* How to request */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              How to Request a Refund
            </h2>
            <p className="text-sm text-charcoal/70 leading-relaxed mb-3">
              To request a refund, please email us at{" "}
              <a
                href="mailto:hello@nestora.ng"
                className="text-forest-green underline hover:text-forest-green/80 transition-colors"
              >
                hello@nestora.ng
              </a>{" "}
              with the subject line <em>&quot;Refund Request — [Booking Reference]&quot;</em>{" "}
              and include:
            </p>
            <ul className="space-y-2 text-sm text-charcoal/70 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                Your full name and email address used to register
              </li>
              <li className="flex items-start gap-2">
                <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                Your booking reference number
              </li>
              <li className="flex items-start gap-2">
                <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                Your payment reference number
              </li>
              <li className="flex items-start gap-2">
                <span className="text-soft-gold mt-0.5 shrink-0">•</span>
                Reason for cancellation (optional but helpful)
              </li>
            </ul>
          </section>

          {/* Processing time */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold text-forest-green mb-4">
              Processing Time
            </h2>
            <p className="text-sm text-charcoal/70 leading-relaxed">
              Approved refunds are processed within{" "}
              <strong>5–10 business days</strong>. The credit will appear on
              your original payment method. Processing times may vary depending
              on your bank or card issuer.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-6 border-t border-charcoal/8">
            <p className="text-sm text-charcoal/50">
              Questions about this policy? Contact us at{" "}
              <a
                href="mailto:hello@nestora.ng"
                className="text-forest-green underline hover:text-forest-green/80 transition-colors"
              >
                hello@nestora.ng
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

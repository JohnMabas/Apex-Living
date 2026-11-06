"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Home,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  AlertCircle,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { getMyPayments } from "@/services/paymentService";
import { formatPrice, formatShortDate } from "@/lib/format";
import type { Payment, PaymentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    INITIALIZED: {
      label: "Initialized",
      className: "bg-blue-50 text-blue-700 border-blue-100",
    },
    PENDING: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-100",
    },
    SUCCESS: {
      label: "Paid",
      className: "bg-green-50 text-green-700 border-green-100",
    },
    FAILED: {
      label: "Failed",
      className: "bg-red-50 text-red-700 border-red-100",
    },
    ABANDONED: {
      label: "Abandoned",
      className: "bg-charcoal/5 text-charcoal/60 border-charcoal/10",
    },
    REFUND_PENDING: {
      label: "Refund Pending",
      className: "bg-orange-50 text-orange-700 border-orange-100",
    },
    REFUNDED: {
      label: "Refunded",
      className: "bg-purple-50 text-purple-700 border-purple-100",
    },
    PARTIALLY_REFUNDED: {
      label: "Part. Refunded",
      className: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
  };

  const { label, className } = map[status] ?? {
    label: status,
    className: "bg-charcoal/5 text-charcoal/60 border-charcoal/10",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inner page
// ---------------------------------------------------------------------------

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const load = useCallback(
    (p: number) => {
      setLoading(true);
      setError(null);
      getMyPayments(p, limit)
        .then((result) => {
          setPayments(result.payments);
          setTotalPages(result.meta.totalPages);
        })
        .catch((err) =>
          setError(
            err instanceof Error ? err.message : "Failed to load payments.",
          ),
        )
        .finally(() => setLoading(false));
    },
    [limit],
  );

  useEffect(() => {
    load(page);
  }, [page, load]);

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-8">
          <Link href="/" className="hover:text-forest-green transition-colors flex items-center gap-1">
            <Home size={12} />
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-forest-green transition-colors">
            My Account
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">Payment History</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/10">
            <CreditCard size={20} className="text-forest-green" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-green">
              Payment History
            </h1>
            <p className="text-sm text-charcoal/50">
              Your payment records and receipts
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-12 text-center">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-green/10 mx-auto mb-4">
              <CreditCard size={24} className="text-forest-green/50" />
            </span>
            <h2 className="font-display text-lg font-semibold text-charcoal mb-2">
              No payments yet
            </h2>
            <p className="text-sm text-charcoal/50 mb-6">
              Your payment history will appear here once you make a booking.
            </p>
            <Link
              href="/apartments"
              className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              Browse Apartments
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-charcoal/8 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal/8 bg-warm-ivory/50">
                    <th className="text-left px-6 py-4 font-medium text-charcoal/60 text-xs uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="text-left px-6 py-4 font-medium text-charcoal/60 text-xs uppercase tracking-wider">
                      Apartment
                    </th>
                    <th className="text-left px-6 py-4 font-medium text-charcoal/60 text-xs uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left px-6 py-4 font-medium text-charcoal/60 text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 font-medium text-charcoal/60 text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/5">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-warm-ivory/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-charcoal/70">
                        {payment.paymentReference}
                      </td>
                      <td className="px-6 py-4 text-charcoal/80">
                        {payment.booking?.apartment.title ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-charcoal">
                        {formatPrice(payment.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="px-6 py-4 text-charcoal/60 text-xs">
                        {formatShortDate(payment.paidAt ?? payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === "SUCCESS" && (
                          <Link
                            href={`/account/payments/${encodeURIComponent(payment.paymentReference)}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-green hover:underline"
                          >
                            <ReceiptText size={13} />
                            Receipt
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-xl border border-charcoal/8 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-sm text-charcoal">
                        {payment.booking?.apartment.title ?? "Payment"}
                      </p>
                      <p className="text-xs text-charcoal/50 font-mono mt-0.5">
                        {payment.paymentReference}
                      </p>
                    </div>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-forest-green">
                        {formatPrice(payment.amount)}
                      </p>
                      <p className="text-xs text-charcoal/50">
                        {formatShortDate(payment.paidAt ?? payment.createdAt)}
                      </p>
                    </div>
                    {payment.status === "SUCCESS" && (
                      <Link
                        href={`/account/payments/${encodeURIComponent(payment.paymentReference)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-green border border-forest-green/20 rounded-lg px-3 py-1.5 hover:bg-forest-green/5 transition-colors"
                      >
                        <ReceiptText size={13} />
                        Receipt
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-charcoal/20 text-sm font-medium text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-charcoal/5 transition-colors"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>
                <span className="text-sm text-charcoal/60">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-charcoal/20 text-sm font-medium text-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-charcoal/5 transition-colors"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AccountPaymentsPage() {
  return (
    <RequireAuth>
      <PaymentsPage />
    </RequireAuth>
  );
}

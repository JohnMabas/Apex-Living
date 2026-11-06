"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ReceiptText,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { getAdminPayments, type AdminPayment } from "@/services/paymentService";
import { formatPrice, formatShortDate } from "@/lib/format";
import type { PaymentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    INITIALIZED: { label: "Initialized", className: "bg-blue-50 text-blue-700 border-blue-100" },
    PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-100" },
    SUCCESS: { label: "Paid", className: "bg-green-50 text-green-700 border-green-100" },
    FAILED: { label: "Failed", className: "bg-red-50 text-red-700 border-red-100" },
    ABANDONED: { label: "Abandoned", className: "bg-charcoal/5 text-charcoal/60 border-charcoal/10" },
    REFUND_PENDING: { label: "Refund Pending", className: "bg-orange-50 text-orange-700 border-orange-100" },
    REFUNDED: { label: "Refunded", className: "bg-purple-50 text-purple-700 border-purple-100" },
    PARTIALLY_REFUNDED: { label: "Part. Refunded", className: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-charcoal/5 text-charcoal/60 border-charcoal/10" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

const ALL_STATUSES: PaymentStatus[] = [
  "INITIALIZED", "PENDING", "SUCCESS", "FAILED", "ABANDONED",
  "REFUND_PENDING", "REFUNDED", "PARTIALLY_REFUNDED",
];

// ---------------------------------------------------------------------------
// Inner page
// ---------------------------------------------------------------------------

function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const load = useCallback(
    (p: number, s: string, st: PaymentStatus | "") => {
      setLoading(true);
      setError(null);
      getAdminPayments({ search: s, status: st, page: p, limit })
        .then((result) => {
          setPayments(result.payments);
          setTotalPages(result.meta.totalPages);
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Failed to load payments."),
        )
        .finally(() => setLoading(false));
    },
    [limit],
  );

  useEffect(() => {
    load(page, search, statusFilter);
  }, [page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1);
    load(1, search, statusFilter);
  };

  const handleStatusChange = (st: PaymentStatus | "") => {
    setStatusFilter(st);
    setPage(1);
    load(1, search, st);
  };

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/10">
            <CreditCard size={20} className="text-forest-green" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-green">
              Payments
            </h1>
            <p className="text-sm text-charcoal/50">
              All payment records across the platform
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search by reference or booking…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              handleStatusChange(e.target.value as PaymentStatus | "")
            }
            className="px-4 py-2.5 rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="px-5 py-2.5 rounded-lg bg-forest-green text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
          >
            Search
          </button>
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
            <h2 className="font-display text-lg font-semibold text-charcoal mb-2">
              No payments found
            </h2>
            <p className="text-sm text-charcoal/50">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-charcoal/8 bg-warm-ivory/50">
                      {[
                        "Payment Ref",
                        "Booking Ref",
                        "Guest",
                        "Apartment",
                        "Amount",
                        "Status",
                        "Date",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3.5 font-medium text-charcoal/60 text-xs uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal/5">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-warm-ivory/30 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-charcoal/70 whitespace-nowrap">
                          {payment.paymentReference}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-charcoal/60 whitespace-nowrap">
                          {payment.booking?.bookingReference ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-charcoal/80 whitespace-nowrap">
                          {payment.booking?.guest?.fullName ?? "—"}
                          {payment.booking?.guest?.email && (
                            <p className="text-xs text-charcoal/45">
                              {payment.booking.guest.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-charcoal/80">
                          {payment.booking?.apartment.title ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-charcoal whitespace-nowrap">
                          {formatPrice(payment.amount)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td className="px-4 py-3.5 text-charcoal/60 text-xs whitespace-nowrap">
                          {formatShortDate(payment.paidAt ?? payment.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
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
            </div>

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

export default function AdminPaymentsPageWrapper() {
  return (
    <RequireAuth adminOnly>
      <AdminPaymentsPage />
    </RequireAuth>
  );
}

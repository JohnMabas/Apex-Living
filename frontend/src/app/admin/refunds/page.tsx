"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { getAdminRefunds, type RefundRequest } from "@/services/paymentService";
import { formatPrice, formatShortDate } from "@/lib/format";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function RefundStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED: "bg-green-50 text-green-700 border-green-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
    PROCESSED: "bg-blue-50 text-blue-700 border-blue-100",
    CANCELLED: "bg-charcoal/5 text-charcoal/60 border-charcoal/10",
  };
  const className =
    map[status] ?? "bg-charcoal/5 text-charcoal/60 border-charcoal/10";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

const REFUND_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PROCESSED", "CANCELLED"];

// ---------------------------------------------------------------------------
// Inner page
// ---------------------------------------------------------------------------

function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const load = useCallback(
    (p: number, st: string) => {
      setLoading(true);
      setError(null);
      getAdminRefunds({ status: st, page: p, limit })
        .then((result) => {
          setRefunds(result.refunds);
          setTotalPages(result.meta.totalPages);
        })
        .catch((err) =>
          setError(
            err instanceof Error ? err.message : "Failed to load refunds.",
          ),
        )
        .finally(() => setLoading(false));
    },
    [limit],
  );

  useEffect(() => {
    load(page, statusFilter);
  }, [page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (st: string) => {
    setStatusFilter(st);
    setPage(1);
    load(1, st);
  };

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-forest-green/10">
            <RefreshCw size={20} className="text-forest-green" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-green">
              Refund Requests
            </h1>
            <p className="text-sm text-charcoal/50">
              Manage refund requests from guests
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
          >
            <option value="">All statuses</option>
            {REFUND_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
        ) : refunds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-12 text-center">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-green/10 mx-auto mb-4">
              <RefreshCw size={24} className="text-forest-green/50" />
            </span>
            <h2 className="font-display text-lg font-semibold text-charcoal mb-2">
              No refund requests
            </h2>
            <p className="text-sm text-charcoal/50">
              {statusFilter
                ? `No refund requests with status "${statusFilter}".`
                : "No refund requests have been submitted yet."}
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
                        "Reason",
                        "Amount",
                        "Status",
                        "Requested",
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
                    {refunds.map((refund) => (
                      <tr
                        key={refund.id}
                        className="hover:bg-warm-ivory/30 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-charcoal/70 whitespace-nowrap">
                          {refund.paymentReference}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-charcoal/60 whitespace-nowrap">
                          {refund.payment?.booking?.bookingReference ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-charcoal/80 whitespace-nowrap">
                          {refund.payment?.booking?.guest?.fullName ?? "—"}
                          {refund.payment?.booking?.guest?.email && (
                            <p className="text-xs text-charcoal/45">
                              {refund.payment.booking.guest.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-charcoal/70 max-w-xs">
                          <p className="truncate" title={refund.reason}>
                            {refund.reason || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-charcoal whitespace-nowrap">
                          {formatPrice(refund.amount)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <RefundStatusBadge status={refund.status} />
                        </td>
                        <td className="px-4 py-3.5 text-charcoal/60 text-xs whitespace-nowrap">
                          {formatShortDate(refund.requestedAt)}
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

export default function AdminRefundsPageWrapper() {
  return (
    <RequireAuth adminOnly>
      <AdminRefundsPage />
    </RequireAuth>
  );
}

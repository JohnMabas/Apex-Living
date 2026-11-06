"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Tag,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { getAdminBookings } from "@/services/bookingService";
import type { Booking, BookingStatus } from "@/types";
import { formatPrice, formatShortDate } from "@/lib/format";

const STATUS_OPTIONS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "DECLINED", label: "Declined" },
];

function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      getAdminBookings({ status, search, page, limit: 12 })
        .then((result) => {
          if (cancelled) return;
          setBookings(result.bookings);
          setTotalPages(result.meta.totalPages);
          setTotal(result.meta.total);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Could not load bookings.");
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [status, search, page]);

  return (
    <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <Link href="/admin" className="text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors">
            Administration
          </Link>
          <h1 className="mt-1 font-display text-3xl font-semibold text-forest-green">
            Booking Management
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {total} booking{total === 1 ? "" : "s"} total
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-charcoal/8 bg-white p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by reference, guest, or apartment…"
              className="w-full rounded-lg border border-charcoal/20 bg-white py-2.5 pl-9 pr-4 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as BookingStatus | ""); setPage(1); }}
            className="rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green/30 border-t-forest-green" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-16 text-center">
            <p className="text-sm font-medium text-charcoal/70">No bookings match this view</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-sm">
            <div className="hidden grid-cols-[2fr_1.2fr_1fr_0.8fr_0.6fr] gap-4 border-b border-charcoal/8 bg-warm-ivory/60 px-5 py-3 text-xs font-medium uppercase tracking-wide text-charcoal/40 md:grid">
              <span>Booking</span>
              <span>Guest</span>
              <span>Dates</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex flex-col gap-2 border-b border-charcoal/8 px-5 py-4 last:border-b-0 hover:bg-warm-ivory/40 md:grid md:grid-cols-[2fr_1.2fr_1fr_0.8fr_0.6fr] md:items-center md:gap-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-charcoal truncate">{booking.apartment.title}</p>
                  <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
                    <Tag size={10} /> {booking.bookingReference}
                  </p>
                </div>
                <p className="text-sm text-charcoal/70 truncate">{booking.guest.fullName}</p>
                <p className="text-xs text-charcoal/60 flex items-center gap-1">
                  <CalendarDays size={11} className="text-soft-gold" />
                  {formatShortDate(booking.checkIn)} → {formatShortDate(booking.checkOut)}
                </p>
                <BookingStatusBadge status={booking.status} />
                <div className="flex items-center justify-between md:justify-end gap-3">
                  <p className="text-sm font-semibold text-forest-green">{formatPrice(booking.totalAmount)}</p>
                  <ArrowRight size={14} className="text-charcoal/30" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm text-charcoal disabled:opacity-40 hover:bg-charcoal/5">
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="text-sm text-charcoal/60">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm text-charcoal disabled:opacity-40 hover:bg-charcoal/5">
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <RequireAuth adminOnly>
      <AdminBookings />
    </RequireAuth>
  );
}

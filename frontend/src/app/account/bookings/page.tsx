"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  Tag,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { getMyBookings } from "@/services/bookingService";
import type { Booking, BookingStatus } from "@/types";
import { formatPrice, formatShortDate, resolveMediaUrl } from "@/lib/format";

const STATUS_OPTIONS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "All bookings" },
  { value: "PENDING", label: "Pending" },
  { value: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ACTIVE", label: "Active stay" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "DECLINED", label: "Declined" },
];

function GuestBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyBookings({ status, page, limit: 8 })
      .then((result) => {
        if (cancelled) return;
        setBookings(result.bookings);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load bookings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, page]);

  return (
    <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/50 mb-6">
          <Link href="/" className="hover:text-forest-green transition-colors flex items-center gap-1">
            <Home size={12} />
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-forest-green transition-colors">
            My Account
          </Link>
          <span>/</span>
          <span className="text-charcoal/80">My Bookings</span>
        </nav>

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-forest-green">
              My Bookings
            </h1>
            <p className="mt-1 text-sm text-charcoal/60">
              {total} booking{total === 1 ? "" : "s"}
            </p>
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BookingStatus | "");
              setPage(1);
            }}
            className="rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green/30 border-t-forest-green" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-16 text-center">
            <CalendarDays size={34} strokeWidth={1.3} className="mx-auto mb-3 text-forest-green/25" />
            <p className="text-sm font-medium text-charcoal/70">No bookings found</p>
            <p className="mt-1 text-xs text-charcoal/50">
              {status ? "Try a different filter." : "Browse apartments to make your first booking."}
            </p>
            <Link
              href="/apartments"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
            >
              Browse Apartments
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const imgUrl = resolveMediaUrl(booking.apartment.mainImage);
              return (
                <Link
                  key={booking.id}
                  href={`/account/bookings/${booking.id}`}
                  className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-charcoal/8 bg-white p-4 shadow-sm hover:border-forest-green/20 hover:shadow-md transition-all"
                >
                  {/* Image */}
                  <div className="relative w-full sm:w-28 h-24 sm:h-20 rounded-xl overflow-hidden bg-forest-green/5 shrink-0">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={booking.apartment.title}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Home size={20} className="text-forest-green/20" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-charcoal truncate">
                        {booking.apartment.title}
                      </p>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-xs text-charcoal/50 mb-2">
                      {booking.apartment.location}, {booking.apartment.city}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-charcoal/60">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} className="text-soft-gold" />
                        {formatShortDate(booking.checkIn)} → {formatShortDate(booking.checkOut)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={12} className="text-soft-gold" />
                        {booking.bookingReference}
                      </span>
                    </div>
                  </div>

                  {/* Price + arrow */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 shrink-0">
                    <p className="text-sm font-semibold text-forest-green">
                      {formatPrice(booking.totalAmount)}
                    </p>
                    <ArrowRight size={16} className="text-charcoal/30" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm text-charcoal disabled:opacity-40 hover:bg-charcoal/5"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="text-sm text-charcoal/60">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm text-charcoal disabled:opacity-40 hover:bg-charcoal/5"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuestBookingsPage() {
  return (
    <RequireAuth>
      <GuestBookings />
    </RequireAuth>
  );
}

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
  Search,
  Tag,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { getHostBookings } from "@/services/bookingService";
import type { Booking, BookingStatus } from "@/types";
import { formatPrice, formatShortDate, resolveMediaUrl } from "@/lib/format";

const STATUS_OPTIONS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "All bookings" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DECLINED", label: "Declined" },
  { value: "EXPIRED", label: "Expired" },
];

function HostBookings() {
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
      getHostBookings({ status, search, page, limit: 10 })
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
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/host" className="text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors">
              Host dashboard
            </Link>
            <h1 className="mt-1 font-display text-3xl font-semibold text-forest-green">
              Reservations
            </h1>
            <p className="mt-1 text-sm text-charcoal/60">
              {total} reservation{total === 1 ? "" : "s"}
            </p>
          </div>
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
            <CalendarDays size={34} strokeWidth={1.3} className="mx-auto mb-3 text-forest-green/25" />
            <p className="text-sm font-medium text-charcoal/70">No reservations found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-sm">
            {bookings.map((booking) => {
              const imgUrl = resolveMediaUrl(booking.apartment.mainImage);
              return (
                <Link
                  key={booking.id}
                  href={`/host/bookings/${booking.id}`}
                  className="flex flex-col gap-4 border-b border-charcoal/8 px-5 py-4 last:border-b-0 hover:bg-warm-ivory/40 sm:flex-row sm:items-center transition-colors"
                >
                  <div className="relative w-14 h-12 rounded-lg overflow-hidden bg-forest-green/5 shrink-0 hidden sm:block">
                    {imgUrl ? (
                      <Image src={imgUrl} alt={booking.apartment.title} fill unoptimized className="object-cover" sizes="56px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Home size={14} className="text-forest-green/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-charcoal truncate">{booking.apartment.title}</p>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-charcoal/50">
                      <span className="flex items-center gap-1">
                        <Tag size={11} /> {booking.bookingReference}
                      </span>
                      <span>{booking.guest.fullName}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} className="text-soft-gold" />
                        {formatShortDate(booking.checkIn)} → {formatShortDate(booking.checkOut)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <p className="text-sm font-semibold text-forest-green">{formatPrice(booking.totalAmount)}</p>
                    <ArrowRight size={15} className="text-charcoal/30" />
                  </div>
                </Link>
              );
            })}
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

export default function HostBookingsPage() {
  return (
    <RequireAuth>
      <HostBookings />
    </RequireAuth>
  );
}

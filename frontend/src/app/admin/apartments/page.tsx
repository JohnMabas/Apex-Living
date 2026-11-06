"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import ApartmentStatusBadge from "@/components/ApartmentStatusBadge";
import { getAdminApartments } from "@/services/apartmentService";
import type { Apartment, ApartmentStatus } from "@/types";
import { formatShortDate } from "@/lib/format";

const STATUS_OPTIONS: { value: ApartmentStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "ARCHIVED", label: "Archived" },
];

function AdminApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [status, setStatus] = useState<ApartmentStatus | "">("PENDING");
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

      getAdminApartments({ status, search, page, limit: 10 })
        .then((result) => {
          if (cancelled) return;
          setApartments(result.apartments);
          setTotalPages(result.meta.totalPages);
          setTotal(result.meta.total);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not load apartments.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, search, page]);

  return (
    <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <Link
            href="/admin"
            className="text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors"
          >
            Administration
          </Link>
          <h1 className="mt-1 font-display text-3xl font-semibold text-forest-green">
            Apartment review
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {total} listing{total === 1 ? "" : "s"} match this view
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-charcoal/8 bg-white p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by title, city, or host…"
              className="w-full rounded-lg border border-charcoal/20 bg-white py-2.5 pl-9 pr-4 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ApartmentStatus | "");
              setPage(1);
            }}
            className="rounded-lg border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
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
        ) : apartments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-16 text-center">
            <Building2
              size={34}
              strokeWidth={1.3}
              className="mx-auto mb-3 text-forest-green/25"
            />
            <p className="text-sm font-medium text-charcoal/70">
              No apartments match this view
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-sm">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_0.8fr] gap-4 border-b border-charcoal/8 bg-warm-ivory/60 px-5 py-3 text-xs font-medium uppercase tracking-wide text-charcoal/40 md:grid">
              <span>Listing</span>
              <span>Host</span>
              <span>Status</span>
              <span className="text-right">Updated</span>
            </div>
            {apartments.map((apartment) => (
              <Link
                key={apartment.id}
                href={`/admin/apartments/${apartment.id}`}
                className="flex flex-col gap-3 border-b border-charcoal/8 px-5 py-4 last:border-b-0 hover:bg-warm-ivory/40 md:grid md:grid-cols-[1.6fr_1fr_1fr_0.8fr] md:items-center md:gap-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-charcoal">
                    {apartment.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-charcoal/50">
                    {apartment.location}, {apartment.city}
                  </p>
                </div>
                <div className="min-w-0 text-sm text-charcoal/70">
                  <p className="truncate">
                    {apartment.host?.fullName ?? "Unknown host"}
                  </p>
                  <p className="truncate text-xs text-charcoal/40">
                    {apartment.host?.email ?? "No email"}
                  </p>
                </div>
                <div>
                  <ApartmentStatusBadge status={apartment.status} />
                </div>
                <div className="text-xs text-charcoal/50 md:text-right">
                  {formatShortDate(apartment.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
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
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
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

export default function AdminApartmentsPage() {
  return (
    <RequireAuth adminOnly>
      <AdminApartments />
    </RequireAuth>
  );
}

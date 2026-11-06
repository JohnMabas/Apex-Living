"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import ApartmentCard from "@/components/ApartmentCard";
import FilterPanel from "@/components/FilterPanel";
import SectionHeading from "@/components/SectionHeading";
import { getPublicApartments } from "@/services/apartmentService";
import type { ApartmentFilters, Apartment } from "@/types";

const defaultFilters: ApartmentFilters = {
  location: "",
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  guests: null,
  sortBy: "default",
};

function ApartmentsContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ApartmentFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("city") ?? "",
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const city = searchParams.get("city") ?? "";
    setSearchQuery(city);
    setFilters(defaultFilters);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      getPublicApartments(
        {
          city: filters.location || undefined,
          search: searchQuery.trim() || undefined,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          bedrooms: filters.bedrooms,
          guests: filters.guests,
          sortBy:
            filters.sortBy === "default" ? "newest" : filters.sortBy,
          page,
          limit: 9,
        },
        controller.signal,
      )
        .then((result) => {
          if (cancelled) return;
          setApartments(result.apartments);
          setTotalPages(result.meta.totalPages);
          setTotal(result.meta.total);
        })
        .catch((err: unknown) => {
          if (cancelled || (err instanceof Error && err.name === "AbortError")) {
            return;
          }
          setError(
            err instanceof Error
              ? err.message
              : "Could not load apartments right now.",
          );
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [filters, searchQuery, page]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      {/* Page header */}
      <div className="bg-forest-green py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Collection"
            title="Browse Apartments"
            description="Discover premium apartments across Nigeria's most vibrant cities."
            light
          />

          {/* Search input */}
          <div className="mt-8 max-w-lg relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-ivory/50 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search by city, location, or name…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 bg-white/10 text-warm-ivory placeholder:text-warm-ivory/50 text-sm focus:outline-none focus:ring-2 focus:ring-soft-gold/50 focus:bg-white/15 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-ivory/50 hover:text-warm-ivory transition-colors"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <p className="text-sm text-charcoal/60">
            {loading ? "Loading…" : `${total} apartment${total !== 1 ? "s" : ""}`}
          </p>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-charcoal/20 bg-white text-sm font-medium text-charcoal hover:border-forest-green hover:text-forest-green transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>

        {/* Mobile filter panel */}
        {showMobileFilters && (
          <div className="lg:hidden mb-6">
            <FilterPanel
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
              onReset={resetFilters}
              resultCount={total}
            />
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterPanel
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPage(1);
                }}
                onReset={resetFilters}
                resultCount={total}
              />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
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
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-forest-green/8 mb-4">
                  <Search size={24} className="text-forest-green/40" />
                </div>
                <h3 className="font-display text-xl font-semibold text-forest-green mb-2">
                  No apartments found
                </h3>
                <p className="text-charcoal/60 text-sm mb-6 max-w-sm">
                  Try adjusting your search or filters to find more options.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-forest-green text-warm-ivory text-sm font-medium rounded-lg hover:bg-forest-green/90 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {apartments.map((apt) => (
                  <ApartmentCard key={apt.id} apartment={apt} />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
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
      </div>
    </div>
  );
}

export default function ApartmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center">
          <p className="text-charcoal/50">Loading apartments…</p>
        </div>
      }
    >
      <ApartmentsContent />
    </Suspense>
  );
}

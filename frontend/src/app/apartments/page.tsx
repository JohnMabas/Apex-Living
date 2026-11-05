"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ApartmentCard from "@/components/ApartmentCard";
import FilterPanel from "@/components/FilterPanel";
import SectionHeading from "@/components/SectionHeading";
import { apartments } from "@/lib/data";
import type { ApartmentFilters } from "@/types";

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
  const [filters, setFilters] = useState<ApartmentFilters>(() => ({
    ...defaultFilters,
    location: searchParams.get("city") ?? "",
  }));
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("city") ?? "",
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const city = searchParams.get("city") ?? "";
    setFilters((prev) => ({ ...prev, location: city }));
    setSearchQuery(city);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = [...apartments];

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (a) =>
          a.city.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q),
      );
    }

    if (filters.location) {
      result = result.filter((a) =>
        a.city.toLowerCase().includes(filters.location.toLowerCase()),
      );
    }

    if (filters.minPrice !== null) {
      result = result.filter((a) => a.pricePerNight >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      result = result.filter((a) => a.pricePerNight <= filters.maxPrice!);
    }
    if (filters.bedrooms !== null) {
      result = result.filter((a) => a.bedrooms >= filters.bedrooms!);
    }
    if (filters.guests !== null) {
      result = result.filter((a) => a.guestCapacity >= filters.guests!);
    }

    if (filters.sortBy === "price-asc") {
      result.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (filters.sortBy === "price-desc") {
      result.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (filters.sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [filters, searchQuery]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery("");
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 bg-white/10 text-warm-ivory placeholder:text-warm-ivory/50 text-sm focus:outline-none focus:ring-2 focus:ring-soft-gold/50 focus:bg-white/15 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
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
            {filtered.length} apartment{filtered.length !== 1 ? "s" : ""}
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
              onChange={setFilters}
              onReset={resetFilters}
              resultCount={filtered.length}
            />
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                resultCount={filtered.length}
              />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
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
                {filtered.map((apt) => (
                  <ApartmentCard key={apt.id} apartment={apt} />
                ))}
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
    <Suspense fallback={
      <div className="min-h-screen bg-warm-ivory pt-20 flex items-center justify-center">
        <p className="text-charcoal/50">Loading apartments…</p>
      </div>
    }>
      <ApartmentsContent />
    </Suspense>
  );
}

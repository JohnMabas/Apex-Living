"use client";

import { SlidersHorizontal, X } from "lucide-react";
import type { ApartmentFilters } from "@/types";
import { locations } from "@/lib/data";

interface FilterPanelProps {
  filters: ApartmentFilters;
  onChange: (filters: ApartmentFilters) => void;
  onReset: () => void;
  resultCount: number;
}

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  resultCount,
}: FilterPanelProps) {
  const set = <K extends keyof ApartmentFilters>(
    key: K,
    value: ApartmentFilters[K],
  ) => onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.location !== "" ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.bedrooms !== null ||
    filters.guests !== null ||
    filters.sortBy !== "default";

  return (
    <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-forest-green" />
          <h2 className="font-semibold text-charcoal text-sm">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-charcoal/50 hover:text-red-500 transition-colors"
          >
            <X size={13} />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Location */}
        <div>
          <label
            htmlFor="filter-location"
            className="block text-xs font-medium text-charcoal/60 mb-2"
          >
            City
          </label>
          <select
            id="filter-location"
            value={filters.location}
            onChange={(e) =>
              set("location", e.target.value)
            }
            className="w-full rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc === "All Locations" ? "" : loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Price range */}
        <div>
          <p className="text-xs font-medium text-charcoal/60 mb-2">
            Price per night (₦)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-min-price" className="sr-only">
                Min price
              </label>
              <input
                id="filter-min-price"
                type="number"
                min={0}
                placeholder="Min"
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  set(
                    "minPrice",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
              />
            </div>
            <div>
              <label htmlFor="filter-max-price" className="sr-only">
                Max price
              </label>
              <input
                id="filter-max-price"
                type="number"
                min={0}
                placeholder="Max"
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  set(
                    "maxPrice",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
              />
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <p className="text-xs font-medium text-charcoal/60 mb-2">Bedrooms</p>
          <div className="flex flex-wrap gap-2">
            {[null, 1, 2, 3, 4].map((n) => (
              <button
                key={String(n)}
                onClick={() => set("bedrooms", n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  filters.bedrooms === n
                    ? "bg-forest-green text-warm-ivory border-forest-green"
                    : "bg-white text-charcoal border-charcoal/20 hover:border-forest-green hover:text-forest-green"
                }`}
              >
                {n === null ? "Any" : n === 4 ? "4+" : String(n)}
              </button>
            ))}
          </div>
        </div>

        {/* Guests */}
        <div>
          <label
            htmlFor="filter-guests"
            className="block text-xs font-medium text-charcoal/60 mb-2"
          >
            Min. guests
          </label>
          <select
            id="filter-guests"
            value={filters.guests ?? ""}
            onChange={(e) =>
              set("guests", e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label
            htmlFor="filter-sort"
            className="block text-xs font-medium text-charcoal/60 mb-2"
          >
            Sort by
          </label>
          <select
            id="filter-sort"
            value={filters.sortBy}
            onChange={(e) =>
              set("sortBy", e.target.value as ApartmentFilters["sortBy"])
            }
            className="w-full rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green"
          >
            <option value="default">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Result count */}
        <p className="text-xs text-charcoal/50 pt-2 border-t border-charcoal/8">
          {resultCount} apartment{resultCount !== 1 ? "s" : ""} found
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CalendarDays, Users, Search } from "lucide-react";
import { locations } from "@/lib/data";
import type { SearchFilters } from "@/types";

interface SearchBarProps {
  compact?: boolean;
  initialValues?: Partial<SearchFilters>;
}

export default function SearchBar({ compact = false, initialValues }: SearchBarProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({
    location: initialValues?.location ?? "",
    checkIn: initialValues?.checkIn ?? "",
    checkOut: initialValues?.checkOut ?? "",
    guests: initialValues?.guests ?? 1,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.location) params.set("city", filters.location);
    if (filters.checkIn) params.set("checkIn", filters.checkIn);
    if (filters.checkOut) params.set("checkOut", filters.checkOut);
    if (filters.guests > 1) params.set("guests", String(filters.guests));
    router.push(`/apartments?${params.toString()}`);
  };

  const today = new Date().toISOString().split("T")[0];

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 items-end"
      >
        <div className="flex-1 relative">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 pointer-events-none"
          />
          <select
            aria-label="Location"
            value={filters.location}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, location: e.target.value }))
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-charcoal/20 bg-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/30 focus:border-forest-green appearance-none"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc === "All Locations" ? "" : loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 bg-forest-green text-warm-ivory text-sm font-medium rounded-lg hover:bg-forest-green/90 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Search size={14} />
          Search
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-lg border border-charcoal/8 p-2"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-charcoal/8">
        {/* Location */}
        <div className="relative px-4 py-3">
          <label className="block text-xs font-semibold text-charcoal/50 mb-1 uppercase tracking-wide">
            Location
          </label>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-soft-gold shrink-0" />
            <select
              aria-label="Select location"
              value={filters.location}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full bg-transparent text-sm text-charcoal focus:outline-none appearance-none cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc === "All Locations" ? "" : loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Check-in */}
        <div className="relative px-4 py-3">
          <label
            htmlFor="search-checkin"
            className="block text-xs font-semibold text-charcoal/50 mb-1 uppercase tracking-wide"
          >
            Check-in
          </label>
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-soft-gold shrink-0" />
            <input
              id="search-checkin"
              type="date"
              min={today}
              value={filters.checkIn}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, checkIn: e.target.value }))
              }
              className="w-full bg-transparent text-sm text-charcoal focus:outline-none"
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="relative px-4 py-3">
          <label
            htmlFor="search-checkout"
            className="block text-xs font-semibold text-charcoal/50 mb-1 uppercase tracking-wide"
          >
            Check-out
          </label>
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-soft-gold shrink-0" />
            <input
              id="search-checkout"
              type="date"
              min={filters.checkIn || today}
              value={filters.checkOut}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, checkOut: e.target.value }))
              }
              className="w-full bg-transparent text-sm text-charcoal focus:outline-none"
            />
          </div>
        </div>

        {/* Guests + button */}
        <div className="relative px-4 py-3 flex items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="search-guests"
              className="block text-xs font-semibold text-charcoal/50 mb-1 uppercase tracking-wide"
            >
              Guests
            </label>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-soft-gold shrink-0" />
              <input
                id="search-guests"
                type="number"
                min={1}
                max={12}
                value={filters.guests}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    guests: Number(e.target.value),
                  }))
                }
                className="w-full bg-transparent text-sm text-charcoal focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="shrink-0 flex items-center justify-center w-10 h-10 bg-forest-green text-warm-ivory rounded-xl hover:bg-forest-green/90 transition-colors"
            aria-label="Search apartments"
          >
            <Search size={17} />
          </button>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Users, Star } from "lucide-react";
import { formatPrice } from "@/lib/data";
import Button from "@/components/Button";

interface BookingSummaryProps {
  pricePerNight: number;
  rating: number;
  reviewCount: number;
}

export default function BookingSummary({
  pricePerNight,
  rating,
  reviewCount,
}: BookingSummaryProps) {
  const today = new Date().toISOString().split("T")[0];
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  const subtotal = nights * pricePerNight;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const handleReserve = (e: FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || nights <= 0) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-forest-green/10 mx-auto mb-4">
          <CalendarDays size={24} className="text-forest-green" />
        </div>
        <h3 className="font-display text-lg font-semibold text-forest-green mb-2">
          Booking request received!
        </h3>
        <p className="text-sm text-charcoal/60 mb-4">
          Sign in or create an account to complete your reservation for{" "}
          <strong>{nights} night{nights !== 1 ? "s" : ""}</strong>.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => (window.location.href = "/login")}
          >
            Sign In to Continue
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => setSubmitted(false)}
          >
            Edit Dates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
      {/* Price + rating header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="text-2xl font-semibold text-forest-green">
            {formatPrice(pricePerNight)}
          </span>
          <span className="text-sm text-charcoal/50 ml-1">/ night</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-soft-gold fill-soft-gold" />
          <span className="text-sm font-medium text-charcoal">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-charcoal/50">({reviewCount})</span>
        </div>
      </div>

      <form onSubmit={handleReserve} className="space-y-4">
        {/* Date inputs */}
        <div className="rounded-xl border border-charcoal/20 overflow-hidden divide-y divide-charcoal/10">
          <div className="grid grid-cols-2 divide-x divide-charcoal/10">
            <div className="p-3">
              <label
                htmlFor="booking-checkin"
                className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1"
              >
                Check-in
              </label>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-soft-gold shrink-0" />
                <input
                  id="booking-checkin"
                  type="date"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) setCheckOut("");
                  }}
                  className="w-full text-sm text-charcoal bg-transparent focus:outline-none"
                />
              </div>
            </div>
            <div className="p-3">
              <label
                htmlFor="booking-checkout"
                className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1"
              >
                Check-out
              </label>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-soft-gold shrink-0" />
                <input
                  id="booking-checkout"
                  type="date"
                  required
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-sm text-charcoal bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="p-3">
            <label
              htmlFor="booking-guests"
              className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1"
            >
              Guests
            </label>
            <div className="flex items-center gap-2">
              <Users size={13} className="text-soft-gold" />
              <input
                id="booking-guests"
                type="number"
                min={1}
                max={12}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full text-sm text-charcoal bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        {nights > 0 && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-charcoal/70">
              <span>
                {formatPrice(pricePerNight)} × {nights} night
                {nights !== 1 ? "s" : ""}
              </span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-charcoal/70">
              <span>Service fee (5%)</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
            <div className="flex justify-between font-semibold text-charcoal border-t border-charcoal/10 pt-2">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" fullWidth size="lg">
          Reserve Apartment
        </Button>
      </form>

      <p className="text-center text-xs text-charcoal/40 mt-4">
        You won&apos;t be charged yet — sign in to confirm
      </p>
    </div>
  );
}

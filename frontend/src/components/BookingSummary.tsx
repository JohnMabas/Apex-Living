"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users, Star, AlertCircle, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { checkAvailability, createBooking } from "@/services/bookingService";
import type { AvailabilityResult } from "@/types";

interface BookingSummaryProps {
  apartmentId: string;
  pricePerNight: number;
  maxGuests: number;
  rating: number;
  reviewCount: number;
}

export default function BookingSummary({
  apartmentId,
  pricePerNight,
  maxGuests,
  rating,
  reviewCount,
}: BookingSummaryProps) {
  const router = useRouter();
  const { user } = useAuth();

  const today = new Date().toISOString().split("T")[0];
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    id: string;
  } | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const runAvailabilityCheck = useCallback(async () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setAvailability(null);
      return;
    }
    setChecking(true);
    setCheckError(null);
    setAvailability(null);
    try {
      const result = await checkAvailability({
        apartmentId,
        checkIn,
        checkOut,
        numberOfGuests: guests,
      });
      setAvailability(result);
    } catch (err) {
      setCheckError(
        err instanceof Error ? err.message : "Could not check availability.",
      );
    } finally {
      setChecking(false);
    }
  }, [apartmentId, checkIn, checkOut, guests]);

  useEffect(() => {
    const timer = setTimeout(runAvailabilityCheck, 500);
    return () => clearTimeout(timer);
  }, [runAvailabilityCheck]);

  async function handleReserve(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!availability?.available) return;
    setReserveError(null);
    setReserving(true);
    try {
      const created = await createBooking({
        apartmentId,
        checkIn,
        checkOut,
        numberOfGuests: guests,
      });
      setConfirmedBooking({ reference: created.bookingReference, id: created.id });
    } catch (err) {
      setReserveError(
        err instanceof Error ? err.message : "Could not create booking.",
      );
    } finally {
      setReserving(false);
    }
  }

  if (confirmedBooking) {
    return (
      <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-forest-green/10 mx-auto mb-4">
          <CalendarDays size={24} className="text-forest-green" />
        </div>
        <h3 className="font-display text-lg font-semibold text-forest-green mb-1">
          Booking request received!
        </h3>
        <p className="mt-1 text-xs font-medium text-charcoal/50 mb-1">
          Reference:{" "}
          <span className="text-forest-green font-semibold">
            {confirmedBooking.reference}
          </span>
        </p>
        <p className="text-sm text-charcoal/60 mb-5 mt-2">
          Your reservation is pending. Complete payment to confirm your stay.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push(`/account/bookings/${confirmedBooking.id}`)}
          >
            View My Booking
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => router.push("/account/bookings")}
          >
            All My Bookings
          </Button>
        </div>
      </div>
    );
  }

  const pricing = availability?.pricing;

  return (
    <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
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
            {rating > 0 ? rating.toFixed(1) : "New"}
          </span>
          <span className="text-xs text-charcoal/50">({reviewCount})</span>
        </div>
      </div>

      <form onSubmit={handleReserve} className="space-y-4">
        <div className="rounded-xl border border-charcoal/20 overflow-hidden divide-y divide-charcoal/10">
          <div className="grid grid-cols-2 divide-x divide-charcoal/10">
            <div className="p-3">
              <label
                htmlFor="bk-checkin"
                className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1"
              >
                Check-in
              </label>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-soft-gold shrink-0" />
                <input
                  id="bk-checkin"
                  type="date"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) setCheckOut("");
                    setAvailability(null);
                  }}
                  className="w-full text-sm text-charcoal bg-transparent focus:outline-none"
                />
              </div>
            </div>
            <div className="p-3">
              <label
                htmlFor="bk-checkout"
                className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1"
              >
                Check-out
              </label>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-soft-gold shrink-0" />
                <input
                  id="bk-checkout"
                  type="date"
                  required
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    setAvailability(null);
                  }}
                  className="w-full text-sm text-charcoal bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="p-3">
            <label
              htmlFor="bk-guests"
              className="block text-xs font-semibold text-charcoal/50 uppercase tracking-wide mb-1"
            >
              Guests
            </label>
            <div className="flex items-center gap-2">
              <Users size={13} className="text-soft-gold" />
              <input
                id="bk-guests"
                type="number"
                min={1}
                max={maxGuests}
                value={guests}
                onChange={(e) => {
                  setGuests(Math.min(maxGuests, Math.max(1, Number(e.target.value))));
                  setAvailability(null);
                }}
                className="w-full text-sm text-charcoal bg-transparent focus:outline-none"
              />
              <span className="text-xs text-charcoal/40 shrink-0">
                max {maxGuests}
              </span>
            </div>
          </div>
        </div>

        {checking && (
          <div className="flex items-center gap-2 text-sm text-charcoal/50">
            <Loader2 size={14} className="animate-spin" />
            Checking availability…
          </div>
        )}

        {checkError && !checking && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {checkError}
          </div>
        )}

        {availability && !availability.available && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            These dates are not available. Please choose different dates.
          </div>
        )}

        {availability?.available && pricing && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-charcoal/70">
              <span>
                {formatPrice(pricing.nightlyPriceSnapshot)} ×{" "}
                {availability.numberOfNights} night
                {availability.numberOfNights !== 1 ? "s" : ""}
              </span>
              <span>{formatPrice(pricing.accommodationSubtotal)}</span>
            </div>
            {pricing.cleaningFeeSnapshot !== null && (
              <div className="flex justify-between text-charcoal/70">
                <span>Cleaning fee</span>
                <span>{formatPrice(pricing.cleaningFeeSnapshot)}</span>
              </div>
            )}
            {pricing.additionalFeesSnapshot !== null && (
              <div className="flex justify-between text-charcoal/70">
                <span>{pricing.otherFeesNote ?? "Additional fees"}</span>
                <span>{formatPrice(pricing.additionalFeesSnapshot)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-charcoal border-t border-charcoal/10 pt-2">
              <span>Total</span>
              <span className="text-forest-green">
                {formatPrice(pricing.totalAmount)}
              </span>
            </div>
          </div>
        )}

        {reserveError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {reserveError}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={reserving}
          disabled={
            !checkIn ||
            !checkOut ||
            checking ||
            (availability !== null && !availability.available)
          }
        >
          {!user
            ? "Sign In to Reserve"
            : availability?.available
              ? "Reserve Apartment"
              : checkIn && checkOut
                ? "Check Availability"
                : "Select Dates to Book"}
        </Button>
      </form>

      <p className="text-center text-xs text-charcoal/40 mt-4">
        {user
          ? "You won't be charged yet — payment is completed in the next step."
          : "Sign in to reserve. No payment required today."}
      </p>
    </div>
  );
}

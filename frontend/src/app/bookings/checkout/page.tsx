"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import Button from "@/components/Button";
import { getPublicApartment } from "@/services/apartmentService";
import { checkAvailability, createGuestBooking } from "@/services/bookingService";
import { initializeGuestPayment } from "@/services/paymentService";
import {
  storeBookingToken,
  storePaymentToken,
} from "@/lib/guestBooking";
import { formatPrice, formatShortDate, resolveMediaUrl } from "@/lib/format";
import type { Apartment, AvailabilityResult } from "@/types";

interface GuestFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  specialRequests: string;
  arrivalTime: string;
  additionalNotes: string;
  acceptTerms: boolean;
}

const initialForm: GuestFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "Nigeria",
  specialRequests: "",
  arrivalTime: "",
  additionalNotes: "",
  acceptTerms: false,
};

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const apartmentId = searchParams.get("apartmentId") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const numberOfGuests = Number(searchParams.get("numberOfGuests") ?? "1");

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const paramsValid =
    Boolean(apartmentId) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    checkOut > checkIn &&
    Number.isInteger(numberOfGuests) &&
    numberOfGuests >= 1;

  useEffect(() => {
    if (!paramsValid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      getPublicApartment(apartmentId),
      checkAvailability({
        apartmentId,
        checkIn,
        checkOut,
        numberOfGuests,
      }),
    ])
      .then(([apt, availabilityResult]) => {
        if (cancelled) return;
        setApartment(apt);
        setAvailability(availabilityResult);
        if (!availabilityResult.available) {
          setLoadError(
            "These dates are no longer available. Please choose different dates.",
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "We could not load this booking.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apartmentId, checkIn, checkOut, numberOfGuests, paramsValid]);

  function update<K extends keyof GuestFormState>(
    key: K,
    value: GuestFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!availability?.available || submitting) return;

    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const result = await createGuestBooking({
        apartmentId,
        checkIn,
        checkOut,
        numberOfGuests,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        specialRequests: form.specialRequests.trim() || undefined,
        arrivalTime: form.arrivalTime.trim() || undefined,
        additionalNotes: form.additionalNotes.trim() || undefined,
        acceptTerms: form.acceptTerms,
      });

      storeBookingToken(result.booking.bookingReference, result.accessToken);

      try {
        const payment = await initializeGuestPayment(
          result.booking.id,
          result.accessToken,
        );
        storePaymentToken(payment.paymentReference, result.accessToken);
        window.location.href = payment.authorizationUrl;
      } catch {
        router.push(
          `/bookings/manage/${encodeURIComponent(
            result.booking.bookingReference,
          )}?token=${encodeURIComponent(result.accessToken)}`,
        );
      }
    } catch (err) {
      const apiError = err as Error & {
        fieldErrors?: Record<string, string[]>;
      };
      setFormError(
        apiError.message ??
          "We could not create your booking. Please try again.",
      );
      if (apiError.fieldErrors) setFieldErrors(apiError.fieldErrors);
      setSubmitting(false);
    }
  }

  if (!paramsValid) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Booking details missing
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            Please select your dates on an apartment page before continuing.
          </p>
          <Link
            href="/apartments"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90"
          >
            Browse Apartments
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-forest-green" />
        <p className="text-sm text-charcoal/60">Preparing your booking…</p>
      </div>
    );
  }

  if (loadError || !apartment || !availability) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Booking unavailable
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            {loadError ?? "We could not load this booking."}
          </p>
          <Link
            href={`/apartments/${apartment?.id ?? apartmentId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90"
          >
            <ArrowLeft size={15} />
            Back to apartment
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = resolveMediaUrl(apartment.mainImage ?? apartment.images[0]?.url);
  const pricing = availability.pricing;
  const specialRequestsError = fieldErrors.specialRequests?.[0];
  const additionalNotesError = fieldErrors.additionalNotes?.[0];

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/apartments/${apartment.id}`}
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to apartment
        </Link>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-soft-gold font-semibold mb-2">
            Secure guest checkout
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-forest-green">
            Complete your booking
          </h1>
          <p className="text-sm text-charcoal/60 mt-2">
            No account required. We&apos;ll email your confirmation and a secure
            link to manage your stay.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
              <h2 className="font-display text-lg font-semibold text-forest-green mb-1">
                Guest details
              </h2>
              <p className="text-xs text-charcoal/50 mb-5">
                The lead guest receives all booking emails.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="First name"
                  id="guest-first"
                  required
                  value={form.firstName}
                  onChange={(v) => update("firstName", v)}
                  autoComplete="given-name"
                  error={fieldErrors.firstName?.[0]}
                />
                <Field
                  label="Last name"
                  id="guest-last"
                  required
                  value={form.lastName}
                  onChange={(v) => update("lastName", v)}
                  autoComplete="family-name"
                  error={fieldErrors.lastName?.[0]}
                />
                <Field
                  label="Email address"
                  id="guest-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={fieldErrors.email?.[0]}
                />
                <Field
                  label="Phone number"
                  id="guest-phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  autoComplete="tel"
                  placeholder="+234 800 000 0000"
                  error={fieldErrors.phone?.[0]}
                />
                <Field
                  label="Country"
                  id="guest-country"
                  required
                  value={form.country}
                  onChange={(v) => update("country", v)}
                  autoComplete="country-name"
                  error={fieldErrors.country?.[0]}
                />
                <Field
                  label="Arrival time (optional)"
                  id="guest-arrival"
                  value={form.arrivalTime}
                  onChange={(v) => update("arrivalTime", v)}
                  placeholder="e.g. 3:00 PM"
                  error={fieldErrors.arrivalTime?.[0]}
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
              <h2 className="font-display text-lg font-semibold text-forest-green mb-1">
                Stay notes
              </h2>
              <p className="text-xs text-charcoal/50 mb-5">
                Optional details help the host prepare for your arrival.
              </p>

              <label
                htmlFor="guest-requests"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Special requests
              </label>
              <textarea
                id="guest-requests"
                rows={3}
                maxLength={1000}
                value={form.specialRequests}
                onChange={(e) => update("specialRequests", e.target.value)}
                placeholder="Accessibility needs, dietary notes, early check-in requests…"
                className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
              {specialRequestsError && (
                <p className="mt-1.5 text-xs text-red-600">
                  {specialRequestsError}
                </p>
              )}

              <label
                htmlFor="guest-notes"
                className="block text-sm font-medium text-charcoal mb-1.5 mt-4"
              >
                Anything else we should know?
              </label>
              <textarea
                id="guest-notes"
                rows={3}
                maxLength={1000}
                value={form.additionalNotes}
                onChange={(e) => update("additionalNotes", e.target.value)}
                placeholder="Other notes for the Nestora team or your host."
                className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
              {additionalNotesError && (
                <p className="mt-1.5 text-xs text-red-600">
                  {additionalNotesError}
                </p>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
              <label className="flex items-start gap-3 text-sm text-charcoal/70">
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={(e) => update("acceptTerms", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-charcoal/30 text-forest-green focus:ring-forest-green"
                  required
                />
                <span>
                  I agree to Nestora&apos;s{" "}
                  <Link
                    href="/refund-policy"
                    target="_blank"
                    className="text-forest-green underline underline-offset-2"
                  >
                    booking and cancellation policy
                  </Link>{" "}
                  and understand that my dates are held for 15 minutes until
                  payment is complete.
                </span>
              </label>
              {fieldErrors.acceptTerms?.[0] && (
                <p className="mt-2 text-xs text-red-600">
                  {fieldErrors.acceptTerms[0]}
                </p>
              )}

              {formError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={submitting}
              >
                <Lock size={15} />
                Continue to Secure Payment
              </Button>
              <p className="mt-3 text-center text-xs text-charcoal/40">
                You&apos;ll be redirected to Paystack. Nestora never sees or
                stores your card details.
              </p>
            </section>
          </form>

          <aside className="lg:sticky lg:top-24 bg-white rounded-2xl border border-charcoal/8 shadow-sm overflow-hidden">
            {imageUrl && (
              <div className="relative h-40 w-full bg-charcoal/5">
                <Image
                  src={imageUrl}
                  alt={apartment.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 380px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="font-display text-lg font-semibold text-forest-green">
                {apartment.title}
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-charcoal/50 mt-1">
                <MapPin size={12} />
                {apartment.location}, {apartment.city}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-charcoal/70">
                  <CalendarDays size={15} className="text-soft-gold" />
                  <span>
                    {formatShortDate(checkIn)} → {formatShortDate(checkOut)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-charcoal/70">
                  <Users size={15} className="text-soft-gold" />
                  <span>
                    {numberOfGuests} guest{numberOfGuests !== 1 ? "s" : ""} ·{" "}
                    {availability.numberOfNights} night
                    {availability.numberOfNights !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-charcoal/10 space-y-2 text-sm">
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
                <div className="flex justify-between font-semibold text-charcoal border-t border-charcoal/10 pt-3">
                  <span>Total</span>
                  <span className="text-forest-green">
                    {formatPrice(pricing.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs text-charcoal/50">
                <p className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-forest-green" />
                  Secure payment via Paystack
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-forest-green" />
                  Free cancellation according to policy
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
  error,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-charcoal mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}

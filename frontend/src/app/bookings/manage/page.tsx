"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, KeyRound, Search } from "lucide-react";
import Button from "@/components/Button";

export default function FindBookingPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedReference = reference.trim().toUpperCase();
    const trimmedToken = token.trim();

    if (!trimmedReference) {
      setError("Enter the booking reference from your email.");
      return;
    }

    setError(null);
    const query = trimmedToken
      ? `?token=${encodeURIComponent(trimmedToken)}`
      : "";
    router.push(
      `/bookings/manage/${encodeURIComponent(trimmedReference)}${query}`,
    );
  }

  return (
    <div className="min-h-screen bg-warm-ivory pt-20 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back home
        </Link>

        <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-green/10 mb-4">
          <Search size={26} className="text-forest-green" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-forest-green mb-1">
          Find my booking
        </h1>
        <p className="text-sm text-charcoal/60 mb-6">
          Enter your booking reference and the secure access code from your
          confirmation email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="booking-reference"
              className="block text-sm font-medium text-charcoal mb-1.5"
            >
              Booking reference
            </label>
            <input
              id="booking-reference"
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="NEST-ABC123"
              autoComplete="off"
              className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm uppercase tracking-wide text-charcoal placeholder:normal-case placeholder:tracking-normal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
            />
          </div>

          <div>
            <label
              htmlFor="booking-access-code"
              className="block text-sm font-medium text-charcoal mb-1.5"
            >
              Access code (optional)
            </label>
            <div className="relative">
              <KeyRound
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35"
              />
              <input
                id="booking-access-code"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="From your booking email"
                autoComplete="off"
                className="w-full rounded-xl border border-charcoal/20 bg-white pl-10 pr-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
            </div>
            <p className="mt-1.5 text-xs text-charcoal/40">
              You can also enter just your reference and paste the access code
              on the next screen.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth>
            Find booking
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-charcoal/40">
          Don&apos;t have a booking yet?{" "}
          <Link
            href="/apartments"
            className="underline hover:text-forest-green"
          >
            Browse apartments
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

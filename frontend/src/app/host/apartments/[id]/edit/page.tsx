"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import ApartmentForm from "@/components/ApartmentForm";
import { getHostApartment } from "@/services/apartmentService";
import type { Apartment } from "@/types";

function EditApartment() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getHostApartment(id)
      .then((result) => {
        if (!cancelled) setApartment(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load this listing.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green/30 border-t-forest-green" />
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-forest-green">
          Listing unavailable
        </h1>
        <p className="mt-2 text-sm text-charcoal/60">
          {error ?? "This apartment could not be found."}
        </p>
        <Link
          href="/host/apartments"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to my apartments
        </Link>
      </div>
    );
  }

  if (
    apartment.status === "PENDING" ||
    apartment.status === "ARCHIVED"
  ) {
    return (
      <div className="rounded-2xl border border-charcoal/8 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-forest-green">
          This listing cannot be edited right now
        </h1>
        <p className="mt-2 text-sm text-charcoal/60">
          {apartment.status === "PENDING"
            ? "Edits are paused while an administrator reviews this listing."
            : "Archived listings cannot be edited."}
        </p>
        <Link
          href={`/host/apartments/${apartment.id}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to listing
        </Link>
      </div>
    );
  }

  return <ApartmentForm mode="edit" apartment={apartment} />;
}

export default function EditApartmentPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <EditApartment />
        </div>
      </div>
    </RequireAuth>
  );
}

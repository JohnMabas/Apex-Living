"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  MapPin,
  Pencil,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import ApartmentStatusBadge from "@/components/ApartmentStatusBadge";
import ImageGallery from "@/components/ImageGallery";
import {
  archiveHostApartment,
  getHostApartment,
  submitApartment,
} from "@/services/apartmentService";
import type { Apartment } from "@/types";
import { formatPrice, formatShortDate, resolveMediaUrl } from "@/lib/format";
import { useEffect } from "react";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-2.5 text-sm last:border-b-0">
      <span className="text-charcoal/50">{label}</span>
      <span className="text-right font-medium text-charcoal">{value}</span>
    </div>
  );
}

function HostApartmentDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  async function handleSubmit() {
    if (!apartment) return;
    setActionError(null);
    setActionLoading("submit");
    try {
      const updated = await submitApartment(apartment.id);
      setApartment(updated);
      router.refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not submit this listing.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleArchive() {
    if (!apartment) return;
    if (
      !window.confirm(
        "Archive this listing? It will no longer be visible to guests or editable by you.",
      )
    ) {
      return;
    }
    setActionError(null);
    setActionLoading("archive");
    try {
      const updated = await archiveHostApartment(apartment.id);
      setApartment(updated);
      router.refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not archive this listing.",
      );
    } finally {
      setActionLoading(null);
    }
  }

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

  const canEdit = ["DRAFT", "REJECTED", "PUBLISHED", "SUSPENDED"].includes(
    apartment.status,
  );
  const canSubmit =
    apartment.status === "DRAFT" || apartment.status === "REJECTED";
  const canArchive = apartment.status !== "ARCHIVED";
  const galleryImages = apartment.images
    .map((image) => resolveMediaUrl(image.url))
    .filter((url): url is string => Boolean(url));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/host/apartments"
            className="inline-flex items-center gap-1 text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors"
          >
            <ArrowLeft size={14} />
            My apartments
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-forest-green">
              {apartment.title}
            </h1>
            <ApartmentStatusBadge status={apartment.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-charcoal/60">
            <MapPin size={14} className="text-soft-gold" />
            {apartment.location}, {apartment.city}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link
              href={`/host/apartments/${apartment.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-forest-green/20 bg-white px-4 py-2.5 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
            >
              <Pencil size={15} />
              Edit listing
            </Link>
          )}
          {canSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-4 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
              {actionLoading === "submit"
                ? "Submitting…"
                : apartment.reviewNotes
                  ? "Resubmit for review"
                  : "Submit for review"}
            </button>
          )}
          {canArchive && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={15} />
              {actionLoading === "archive" ? "Archiving…" : "Archive"}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {apartment.status === "REJECTED" && apartment.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertTriangle size={16} />
            Changes requested by admin
          </p>
          <p className="mt-1.5 text-sm text-red-700/80">
            {apartment.rejectionReason}
          </p>
        </div>
      )}

      {apartment.status === "DRAFT" && apartment.reviewNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <AlertTriangle size={16} />
            Admin review notes
          </p>
          <p className="mt-1.5 text-sm text-amber-700/80">
            {apartment.reviewNotes}
          </p>
        </div>
      )}

      {apartment.status === "SUSPENDED" && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <AlertTriangle size={16} />
            This listing has been suspended
          </p>
          {apartment.reviewNotes && (
            <p className="mt-1.5 text-sm text-orange-700/80">
              {apartment.reviewNotes}
            </p>
          )}
        </div>
      )}

      {apartment.status === "PENDING" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Clock3 size={16} />
            Awaiting admin review
          </p>
          <p className="mt-1.5 text-sm text-amber-700/80">
            Submitted {formatShortDate(apartment.submittedAt)}. Edits are paused
            until the review is complete.
          </p>
        </div>
      )}

      {apartment.status === "PUBLISHED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} />
            Live on Nestora
          </p>
          <p className="mt-1.5 text-sm text-emerald-700/80">
            Published {formatShortDate(apartment.publishedAt)}. Saving changes
            to a published listing sends it back for admin review.
          </p>
        </div>
      )}

      {galleryImages.length > 0 ? (
        <ImageGallery images={galleryImages} title={apartment.title} />
      ) : (
        <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal/20 bg-white/60 text-center">
          <ImageIcon
            size={32}
            strokeWidth={1.3}
            className="mb-2 text-forest-green/25"
          />
          <p className="text-sm font-medium text-charcoal/60">No photos yet</p>
          <p className="text-xs text-charcoal/45">
            Add at least one photo before submitting for review.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              About this space
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal/70">
              {apartment.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-2 rounded-lg bg-warm-ivory px-3 py-2 text-sm text-charcoal/70">
                <Users size={15} className="text-forest-green/60" />
                {apartment.maxGuests} guests
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-warm-ivory px-3 py-2 text-sm text-charcoal/70">
                <BedDouble size={15} className="text-forest-green/60" />
                {apartment.bedrooms} bedroom
                {apartment.bedrooms !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-warm-ivory px-3 py-2 text-sm text-charcoal/70">
                <Bath size={15} className="text-forest-green/60" />
                {apartment.bathrooms} bathroom
                {apartment.bathrooms !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-warm-ivory px-3 py-2 text-sm text-charcoal/70">
                <Building2 size={15} className="text-forest-green/60" />
                {apartment.propertyType}
              </span>
            </div>
          </section>

          {apartment.amenities.length > 0 && (
            <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-semibold text-forest-green">
                Amenities
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {apartment.amenities.map((amenity) => (
                  <span
                    key={amenity.id}
                    className="rounded-full border border-forest-green/15 bg-forest-green/5 px-3 py-1 text-xs font-medium text-forest-green"
                  >
                    {amenity.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              House rules & policies
            </h2>
            <div className="mt-3 divide-y divide-charcoal/8">
              <DetailRow label="Check-in" value={apartment.checkInInfo} />
              <DetailRow label="Check-out" value={apartment.checkOutInfo} />
              <DetailRow label="Smoking" value={apartment.smokingPolicy} />
              <DetailRow label="Pets" value={apartment.petPolicy} />
              {apartment.additionalRules && (
                <DetailRow
                  label="Additional rules"
                  value={apartment.additionalRules}
                />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Pricing
            </h2>
            <div className="mt-3 divide-y divide-charcoal/8">
              <DetailRow
                label="Per night"
                value={formatPrice(apartment.pricePerNight)}
              />
              <DetailRow
                label="Cleaning fee"
                value={
                  apartment.cleaningFee !== null
                    ? formatPrice(apartment.cleaningFee)
                    : "None"
                }
              />
              <DetailRow
                label="Other fees"
                value={
                  apartment.otherFees !== null
                    ? formatPrice(apartment.otherFees)
                    : "None"
                }
              />
              {apartment.otherFeesNote && (
                <DetailRow
                  label="Fee note"
                  value={apartment.otherFeesNote}
                />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Listing information
            </h2>
            <div className="mt-3 divide-y divide-charcoal/8">
              <DetailRow label="Status" value={apartment.status} />
              <DetailRow
                label="Created"
                value={formatShortDate(apartment.createdAt)}
              />
              <DetailRow
                label="Last updated"
                value={formatShortDate(apartment.updatedAt)}
              />
              <DetailRow label="Photos" value={apartment.images.length} />
              <DetailRow
                label="Public page"
                value={
                  apartment.status === "PUBLISHED" ? (
                    <Link
                      href={`/apartments/${apartment.id}`}
                      className="text-forest-green hover:text-soft-gold"
                    >
                      View listing
                    </Link>
                  ) : (
                    "Only visible when published"
                  )
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-charcoal/70">
              <CalendarDays size={15} className="text-forest-green/60" />
              Listing address
            </p>
            <p className="mt-2 text-sm text-charcoal/60">
              {apartment.address}
              <br />
              {apartment.location}, {apartment.city}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function HostApartmentDetailPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <HostApartmentDetail />
        </div>
      </div>
    </RequireAuth>
  );
}

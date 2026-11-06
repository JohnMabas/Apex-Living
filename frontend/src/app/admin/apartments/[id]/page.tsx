"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  Send,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import ApartmentStatusBadge from "@/components/ApartmentStatusBadge";
import ImageGallery from "@/components/ImageGallery";
import {
  approveApartment,
  archiveAdminApartment,
  getAdminApartment,
  rejectApartment,
  requestApartmentChanges,
  suspendApartment,
} from "@/services/apartmentService";
import type { Apartment } from "@/types";
import { formatPrice, formatShortDate, resolveMediaUrl } from "@/lib/format";

type ReasonPanel = "reject" | "request-changes" | "suspend";

const PANEL_CONFIG: Record<
  ReasonPanel,
  { title: string; description: string; cta: string; tone: string }
> = {
  reject: {
    title: "Reject this listing",
    description:
      "The host will see this reason and can update the listing before submitting it again.",
    cta: "Reject listing",
    tone: "red",
  },
  "request-changes": {
    title: "Request changes",
    description:
      "The listing moves back to the host's drafts with your notes attached.",
    cta: "Request changes",
    tone: "amber",
  },
  suspend: {
    title: "Suspend this listing",
    description:
      "The listing will be removed from public view until the issue is resolved.",
    cta: "Suspend listing",
    tone: "orange",
  },
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-2.5 text-sm last:border-b-0">
      <span className="text-charcoal/50">{label}</span>
      <span className="text-right font-medium text-charcoal">{value}</span>
    </div>
  );
}

function AdminApartmentDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<ReasonPanel | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getAdminApartment(id)
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

  async function runAction(label: string, action: () => Promise<Apartment>) {
    setActionError(null);
    setMessage(null);
    setBusy(label);
    try {
      const updated = await action();
      setApartment(updated);
      setPanel(null);
      setReason("");
      setMessage("Moderation action completed.");
      router.refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "The action could not be completed.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleArchive() {
    if (!apartment) return;
    if (
      !window.confirm(
        "Archive this listing? It will be permanently removed from public view.",
      )
    ) {
      return;
    }
    await runAction("archive", () => archiveAdminApartment(apartment.id));
  }

  async function handleReasonAction() {
    if (!apartment || !panel) return;
    if (reason.trim().length < 5) {
      setActionError("Please provide a reason of at least 5 characters.");
      return;
    }

    if (panel === "reject") {
      await runAction("reject", () => rejectApartment(apartment.id, reason.trim()));
    } else if (panel === "request-changes") {
      await runAction("request-changes", () =>
        requestApartmentChanges(apartment.id, reason.trim()),
      );
    } else {
      await runAction("suspend", () =>
        suspendApartment(apartment.id, reason.trim()),
      );
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
          href="/admin/apartments"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to review queue
        </Link>
      </div>
    );
  }

  const galleryImages = apartment.images
    .map((image) => resolveMediaUrl(image.url))
    .filter((url): url is string => Boolean(url));
  const isPending = apartment.status === "PENDING";
  const isPublished = apartment.status === "PUBLISHED";
  const canArchive = apartment.status !== "ARCHIVED";
  const config = panel ? PANEL_CONFIG[panel] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/admin/apartments"
            className="inline-flex items-center gap-1 text-sm font-medium text-charcoal/50 hover:text-forest-green transition-colors"
          >
            <ArrowLeft size={14} />
            Apartment review
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
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {apartment.reviewNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <AlertTriangle size={16} />
            Current review notes
          </p>
          <p className="mt-1.5 text-sm text-amber-700/80">
            {apartment.reviewNotes}
          </p>
        </div>
      )}

      {apartment.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <XCircle size={16} />
            Rejection reason shown to host
          </p>
          <p className="mt-1.5 text-sm text-red-700/80">
            {apartment.rejectionReason}
          </p>
        </div>
      )}

      {galleryImages.length > 0 ? (
        <ImageGallery images={galleryImages} title={apartment.title} />
      ) : (
        <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal/20 bg-white/60 text-center">
          <p className="text-sm font-medium text-charcoal/60">
            No photos uploaded
          </p>
          <p className="text-xs text-charcoal/45">
            A listing cannot be published without at least one photo.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Listing details
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

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Amenities
            </h2>
            {apartment.amenities.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal/50">
                No amenities were selected.
              </p>
            ) : (
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
            )}
          </section>

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Policies & location
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
              <DetailRow
                label="Address"
                value={`${apartment.address}, ${apartment.location}, ${apartment.city}`}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Moderation
            </h2>

            <div className="mt-4 space-y-2">
              {isPending && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      runAction("approve", () =>
                        approveApartment(apartment.id),
                      )
                    }
                    disabled={busy !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-green px-4 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 size={16} />
                    {busy === "approve" ? "Approving…" : "Approve & publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel("request-changes");
                      setReason("");
                      setActionError(null);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <Send size={16} />
                    Request changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel("reject");
                      setReason("");
                      setActionError(null);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={16} />
                    Reject listing
                  </button>
                </>
              )}

              {isPublished && (
                <button
                  type="button"
                  onClick={() => {
                    setPanel("suspend");
                    setReason("");
                    setActionError(null);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                >
                  <PauseCircle size={16} />
                  Suspend listing
                </button>
              )}

              {!isPending && !isPublished && (
                <p className="rounded-lg bg-warm-ivory px-3 py-2.5 text-xs text-charcoal/55">
                  No review actions are available for a{" "}
                  {apartment.status.toLowerCase()} listing.
                </p>
              )}

              {canArchive && (
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm font-medium text-charcoal/60 hover:bg-charcoal/5 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={16} />
                  {busy === "archive" ? "Archiving…" : "Archive listing"}
                </button>
              )}
            </div>

            {config && panel && (
              <div className="mt-5 rounded-xl border border-charcoal/10 bg-warm-ivory/60 p-4">
                <h3 className="text-sm font-semibold text-charcoal">
                  {config.title}
                </h3>
                <p className="mt-1 text-xs text-charcoal/55">
                  {config.description}
                </p>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Explain what needs to change (minimum 5 characters)…"
                  className="mt-3 w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/30"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleReasonAction}
                    disabled={busy !== null}
                    className={`inline-flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                      panel === "reject"
                        ? "bg-red-600 hover:bg-red-700"
                        : panel === "suspend"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    {busy ? "Saving…" : config.cta}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel(null);
                      setReason("");
                      setActionError(null);
                    }}
                    className="rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm text-charcoal/60 hover:bg-charcoal/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Host
            </h2>
            {apartment.host ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium text-charcoal">
                  {apartment.host.fullName}
                </p>
                {apartment.host.email && (
                  <a
                    href={`mailto:${apartment.host.email}`}
                    className="flex items-center gap-2 text-charcoal/60 hover:text-forest-green"
                  >
                    <Mail size={14} />
                    {apartment.host.email}
                  </a>
                )}
                {apartment.host.phone && (
                  <a
                    href={`tel:${apartment.host.phone}`}
                    className="flex items-center gap-2 text-charcoal/60 hover:text-forest-green"
                  >
                    <Phone size={14} />
                    {apartment.host.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-charcoal/50">
                Host information unavailable.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-charcoal/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-forest-green">
              Pricing & history
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
              <DetailRow
                label="Created"
                value={formatShortDate(apartment.createdAt)}
              />
              <DetailRow
                label="Submitted"
                value={formatShortDate(apartment.submittedAt)}
              />
              <DetailRow
                label="Reviewed"
                value={formatShortDate(apartment.reviewedAt)}
              />
              <DetailRow
                label="Published"
                value={formatShortDate(apartment.publishedAt)}
              />
              <DetailRow
                label="Suspended"
                value={formatShortDate(apartment.suspendedAt)}
              />
            </div>
            {apartment.status === "PENDING" && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <Clock3 size={13} />
                This listing is waiting for review.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminApartmentDetailPage() {
  return (
    <RequireAuth adminOnly>
      <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AdminApartmentDetail />
        </div>
      </div>
    </RequireAuth>
  );
}

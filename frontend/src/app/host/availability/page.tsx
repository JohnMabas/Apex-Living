"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Lock,
  Trash2,
  AlertCircle,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import {
  getHostApartmentAvailability,
  blockApartmentDates,
  unblockApartmentDates,
} from "@/services/availabilityService";
import { getHostApartments } from "@/services/apartmentService";
import type { AvailabilityBlock, BlockType, Apartment } from "@/types";
import { formatShortDate } from "@/lib/format";

const blockTypes: { value: BlockType; label: string }[] = [
  { value: "HOST_BLOCK", label: "Host block" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RENOVATION", label: "Renovation" },
  { value: "PERSONAL_USE", label: "Personal use" },
  { value: "OTHER", label: "Other" },
];

function AvailabilityInner() {
  const searchParams = useSearchParams();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState(
    searchParams.get("apartmentId") ?? "",
  );
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loadingApts, setLoadingApts] = useState(true);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    blockType: "HOST_BLOCK" as BlockType,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingApts(true);
    getHostApartments({ limit: 50 })
      .then((result) => {
        if (!cancelled) {
          setApartments(result.apartments);
          if (!selectedApartmentId && result.apartments.length > 0) {
            setSelectedApartmentId(result.apartments[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your apartments.");
      })
      .finally(() => {
        if (!cancelled) setLoadingApts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedApartmentId]);

  useEffect(() => {
    if (!selectedApartmentId) {
      setBlocks([]);
      return;
    }
    let cancelled = false;
    setLoadingBlocks(true);
    setError(null);
    getHostApartmentAvailability(selectedApartmentId)
      .then((result) => {
        if (!cancelled) setBlocks(result.blocks);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load availability blocks.");
      })
      .finally(() => {
        if (!cancelled) setLoadingBlocks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedApartmentId]);

  async function handleBlock(e: FormEvent) {
    e.preventDefault();
    if (!selectedApartmentId || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const block = await blockApartmentDates(selectedApartmentId, {
        startDate: blockForm.startDate,
        endDate: blockForm.endDate,
        reason: blockForm.reason.trim() || undefined,
        blockType: blockForm.blockType,
      });
      setBlocks((prev) => [...prev, block].sort((a, b) =>
        a.startDate < b.startDate ? -1 : 1,
      ));
      setShowBlockForm(false);
      setBlockForm({ startDate: "", endDate: "", reason: "", blockType: "HOST_BLOCK" });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not block dates.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnblock(blockId: string) {
    if (!selectedApartmentId) return;
    try {
      await unblockApartmentDates(selectedApartmentId, blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unblock dates.");
    }
  }

  return (
    <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/host"
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <div className="mb-8">
          <p className="text-sm font-medium text-soft-gold mb-1">Availability</p>
          <h1 className="font-display text-3xl font-semibold text-forest-green">
            Availability calendar
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Block dates for maintenance, personal use, or other reasons.
          </p>
        </div>

        {loadingApts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-forest-green" />
          </div>
        ) : apartments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-12 text-center">
            <Calendar size={32} className="mx-auto mb-3 text-forest-green/25" />
            <p className="text-sm font-medium text-charcoal/70">
              You have no apartments to manage
            </p>
            <Link
              href="/host/apartments/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90"
            >
              Add apartment
            </Link>
          </div>
        ) : (
          <>
            {/* Apartment selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal mb-2">
                Select apartment
              </label>
              <select
                value={selectedApartmentId}
                onChange={(e) => setSelectedApartmentId(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              >
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.title} — {apt.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Block form toggle */}
            <div className="mb-6">
              {!showBlockForm ? (
                <button
                  onClick={() => {
                    setShowBlockForm(true);
                    setSuccess(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors"
                >
                  <Lock size={16} /> Block dates
                </button>
              ) : (
                <form
                  onSubmit={handleBlock}
                  className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 space-y-4"
                >
                  <h2 className="font-display text-lg font-semibold text-forest-green">
                    Block dates
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1.5">
                        Start date
                      </label>
                      <input
                        type="date"
                        required
                        value={blockForm.startDate}
                        onChange={(e) =>
                          setBlockForm((f) => ({ ...f, startDate: e.target.value }))
                        }
                        className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1.5">
                        End date
                      </label>
                      <input
                        type="date"
                        required
                        min={blockForm.startDate}
                        value={blockForm.endDate}
                        onChange={(e) =>
                          setBlockForm((f) => ({ ...f, endDate: e.target.value }))
                        }
                        className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1.5">
                      Block type
                    </label>
                    <select
                      value={blockForm.blockType}
                      onChange={(e) =>
                        setBlockForm((f) => ({
                          ...f,
                          blockType: e.target.value as BlockType,
                        }))
                      }
                      className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
                    >
                      {blockTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1.5">
                      Reason (optional)
                    </label>
                    <input
                      value={blockForm.reason}
                      onChange={(e) =>
                        setBlockForm((f) => ({ ...f, reason: e.target.value }))
                      }
                      maxLength={500}
                      placeholder="e.g. Plumbing repair"
                      className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 transition-colors disabled:opacity-50"
                    >
                      {submitting && <Loader2 size={15} className="animate-spin" />}
                      Confirm block
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockForm(false)}
                      className="inline-flex items-center rounded-lg border border-charcoal/20 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <AlertCircle size={15} /> Dates blocked successfully.
              </div>
            )}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {/* Blocked dates list */}
            {loadingBlocks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-forest-green" />
              </div>
            ) : blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-12 text-center">
                <Calendar size={32} className="mx-auto mb-3 text-forest-green/25" />
                <p className="text-sm font-medium text-charcoal/70">
                  No blocked dates for this apartment
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-sm">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between gap-4 border-b border-charcoal/8 px-5 py-4 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-charcoal">
                        {formatShortDate(block.startDate)} →{" "}
                        {formatShortDate(block.endDate)}
                      </p>
                      <p className="text-xs text-charcoal/50 mt-0.5">
                        {blockTypes.find((t) => t.value === block.blockType)?.label ?? block.blockType}
                        {block.reason ? ` · ${block.reason}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblock(block.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} /> Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-forest-green" />
          </div>
        }
      >
        <AvailabilityInner />
      </Suspense>
    </RequireAuth>
  );
}

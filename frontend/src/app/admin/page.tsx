"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileEdit,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import ApartmentStatusBadge from "@/components/ApartmentStatusBadge";
import {
  getAdminApartmentStats,
  getAdminApartments,
} from "@/services/apartmentService";
import type { AdminApartmentStats, Apartment } from "@/types";
import { formatShortDate } from "@/lib/format";

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-charcoal/8 bg-white p-5 shadow-sm">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
      >
        {icon}
      </span>
      <p className="mt-4 text-2xl font-semibold text-forest-green">{value}</p>
      <p className="text-xs text-charcoal/55">{label}</p>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState<AdminApartmentStats | null>(null);
  const [pending, setPending] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAdminApartmentStats(),
      getAdminApartments({ status: "PENDING", limit: 5, page: 1 }),
    ])
      .then(([statsResult, listResult]) => {
        if (cancelled) return;
        setStats(statsResult);
        setPending(listResult.apartments);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load the admin dashboard.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-soft-gold mb-1">
            Administration
          </p>
          <h1 className="font-display text-3xl font-semibold text-forest-green">
            Apartment management
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Review submissions and keep the public marketplace healthy.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/apartments"
              className="inline-flex items-center gap-2 rounded-lg border border-forest-green/20 bg-white px-4 py-2 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
            >
              Apartment Review
            </Link>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-2 rounded-lg border border-forest-green/20 bg-white px-4 py-2 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
            >
              Booking Management
            </Link>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 rounded-lg border border-forest-green/20 bg-white px-4 py-2 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
            >
              Payments
            </Link>
            <Link
              href="/admin/refunds"
              className="inline-flex items-center gap-2 rounded-lg border border-forest-green/20 bg-white px-4 py-2 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
            >
              Refunds
            </Link>
            <Link
              href="/admin/support"
              className="inline-flex items-center gap-2 rounded-lg border border-forest-green/20 bg-white px-4 py-2 text-sm font-medium text-forest-green hover:bg-forest-green/5 transition-colors"
            >
              Support Tickets
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-green/30 border-t-forest-green" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total listings"
                value={stats.total}
                icon={<Building2 size={19} className="text-forest-green" />}
                tone="bg-forest-green/8"
              />
              <StatCard
                label="Published"
                value={stats.published}
                icon={<CheckCircle2 size={19} className="text-emerald-600" />}
                tone="bg-emerald-50"
              />
              <StatCard
                label="Pending review"
                value={stats.pending}
                icon={<Clock3 size={19} className="text-amber-600" />}
                tone="bg-amber-50"
              />
              <StatCard
                label="Suspended"
                value={stats.suspended}
                icon={<ShieldAlert size={19} className="text-orange-500" />}
                tone="bg-orange-50"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Drafts"
                value={stats.draft}
                icon={<FileEdit size={19} className="text-charcoal/60" />}
                tone="bg-charcoal/5"
              />
              <StatCard
                label="Rejected"
                value={stats.rejected}
                icon={<XCircle size={19} className="text-red-500" />}
                tone="bg-red-50"
              />
              <StatCard
                label="Archived"
                value={stats.archived}
                icon={<Building2 size={19} className="text-charcoal/40" />}
                tone="bg-charcoal/5"
              />
              <StatCard
                label="Awaiting action"
                value={stats.pending}
                icon={<Clock3 size={19} className="text-amber-600" />}
                tone="bg-amber-50"
              />
            </div>

            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-forest-green">
                  Pending review queue
                </h2>
                <Link
                  href="/admin/apartments"
                  className="inline-flex items-center gap-1 text-sm font-medium text-forest-green hover:text-soft-gold transition-colors"
                >
                  View queue
                  <ArrowRight size={15} />
                </Link>
              </div>

              {pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-12 text-center">
                  <CheckCircle2
                    size={30}
                    strokeWidth={1.3}
                    className="mx-auto mb-3 text-emerald-500/40"
                  />
                  <p className="text-sm font-medium text-charcoal/70">
                    The review queue is clear
                  </p>
                  <p className="mt-1 text-xs text-charcoal/50">
                    New submissions will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-sm">
                  {pending.map((apartment) => (
                    <Link
                      key={apartment.id}
                      href={`/admin/apartments/${apartment.id}`}
                      className="flex flex-col gap-3 border-b border-charcoal/8 px-5 py-4 last:border-b-0 hover:bg-warm-ivory/40 sm:flex-row sm:items-center sm:justify-between transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-charcoal">
                          {apartment.title}
                        </p>
                        <p className="mt-0.5 text-xs text-charcoal/50">
                          {apartment.host?.fullName ?? "Unknown host"} ·{" "}
                          {apartment.location}, {apartment.city} · Submitted{" "}
                          {formatShortDate(
                            apartment.submittedAt ?? apartment.updatedAt,
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ApartmentStatusBadge status={apartment.status} />
                        <ArrowRight size={16} className="text-charcoal/30" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <RequireAuth adminOnly>
      <AdminOverview />
    </RequireAuth>
  );
}

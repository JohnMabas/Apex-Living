import type { ApartmentStatus } from "@/types";

const STYLES: Record<ApartmentStatus, string> = {
  DRAFT: "bg-charcoal/8 text-charcoal/70 border-charcoal/10",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200",
  ARCHIVED: "bg-charcoal/5 text-charcoal/50 border-charcoal/10",
};

const LABELS: Record<ApartmentStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
};

export default function ApartmentStatusBadge({
  status,
}: {
  status: ApartmentStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

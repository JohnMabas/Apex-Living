import type { BookingStatus } from "@/types";

const STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  AWAITING_PAYMENT: "bg-blue-50 text-blue-700 border-blue-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACTIVE: "bg-forest-green/10 text-forest-green border-forest-green/20",
  COMPLETED: "bg-charcoal/8 text-charcoal/70 border-charcoal/15",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-charcoal/5 text-charcoal/50 border-charcoal/10",
  DECLINED: "bg-orange-50 text-orange-700 border-orange-200",
};

const LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active stay",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  DECLINED: "Declined",
};

export default function BookingStatusBadge({
  status,
}: {
  status: BookingStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  ReceiptText,
  Users,
  XCircle,
} from "lucide-react";
import Button from "@/components/Button";
import {
  cancelGuestBooking,
  getGuestBooking,
} from "@/services/bookingService";
import {
  downloadGuestReceipt,
  initializeGuestPayment,
} from "@/services/paymentService";
import {
  getStoredBookingToken,
  storeBookingToken,
  storePaymentToken,
} from "@/lib/guestBooking";
import { formatPrice, formatShortDate, resolveMediaUrl } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types";

const statusStyles: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-charcoal/5 text-charcoal/70 border-charcoal/15",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
};

const cancellableStatuses: BookingStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "CONFIRMED",
];

const payableStatuses: BookingStatus[] = ["PENDING", "AWAITING_PAYMENT"];

function ManageBookingInner() {
  const params = useParams<{ reference: string }>();
  const searchParams = useSearchParams();
  const reference = params.reference ?? "";
  const queryToken = searchParams.get("token") ?? "";

  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const candidate =
      queryToken || (reference ? getStoredBookingToken(reference) : "");
    if (candidate) {
      setToken(candidate);
      setTokenInput(candidate);
      storeBookingToken(reference, candidate);
    }
  }, [queryToken, reference]);

  const loadBooking = useCallback(
    async (accessToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getGuestBooking(reference, accessToken);
        setBooking(result);
        storeBookingToken(reference, accessToken);
      } catch (err) {
        setBooking(null);
        setError(
          err instanceof Error
            ? err.message
            : "We could not load this booking.",
        );
      } finally {
        setLoading(false);
      }
    },
    [reference],
  );

  useEffect(() => {
    if (token && reference) {
      void loadBooking(token);
    }
  }, [token, reference, loadBooking]);

  function handleUnlock(e: FormEvent) {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    setToken(trimmed);
  }

  async function handlePay() {
    if (!booking || !token) return;
    setPaying(true);
    setActionError(null);
    try {
      const payment = await initializeGuestPayment(booking.id, token);
      storePaymentToken(payment.paymentReference, token);
      window.location.href = payment.authorizationUrl;
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "We could not start the payment. Please try again.",
      );
      setPaying(false);
    }
  }

  async function handleDownloadReceipt() {
    if (!booking?.latestPayment || !token) return;
    setDownloading(true);
    setActionError(null);
    try {
      const blob = await downloadGuestReceipt(
        booking.latestPayment.paymentReference,
        token,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Nestora-Receipt-${booking.bookingReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not download your receipt.",
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleCancel(e: FormEvent) {
    e.preventDefault();
    if (!booking || !token) return;
    const reason = cancelReason.trim();
    if (!reason) {
      setActionError("Please tell us why you are cancelling.");
      return;
    }

    setCancelling(true);
    setActionError(null);
    try {
      const updated = await cancelGuestBooking(reference, token, reason);
      setBooking(updated);
      setShowCancel(false);
      setCancelReason("");
      setActionMessage("Your booking has been cancelled.");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "We could not cancel this booking.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (!reference) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Booking reference missing
          </h1>
          <Link
            href="/bookings/manage"
            className="inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90"
          >
            Find my booking
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-green/10 mx-auto mb-4">
            <KeyRound size={26} className="text-forest-green" />
          </span>
          <h1 className="font-display text-xl font-semibold text-forest-green text-center mb-1">
            Manage booking {reference}
          </h1>
          <p className="text-sm text-charcoal/60 text-center mb-6">
            Enter the secure access code from your booking email to view or
            manage this reservation.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label
                htmlFor="booking-token"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Access code
              </label>
              <input
                id="booking-token"
                type="password"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste the access code from your email"
                autoComplete="off"
                className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" variant="primary" fullWidth>
              <Lock size={15} />
              View My Booking
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-charcoal/40">
            Lost your access code? Email{" "}
            <a
              href="mailto:hello@nestora.ng"
              className="underline hover:text-forest-green"
            >
              hello@nestora.ng
            </a>{" "}
            with your booking reference.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-forest-green" />
        <p className="text-sm text-charcoal/60">Loading your booking…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-warm-ivory pt-24 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-charcoal/8 shadow-sm p-8 text-center">
          <AlertCircle size={30} className="text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-xl font-semibold text-charcoal mb-2">
            Booking not available
          </h1>
          <p className="text-sm text-charcoal/60 mb-6">
            {error ?? "We could not load this booking."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/bookings/manage"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal/20 px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5"
            >
              Try another code
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canPay =
    payableStatuses.includes(booking.status) &&
    (!booking.expiresAt || new Date(booking.expiresAt) > new Date());
  const canCancel = cancellableStatuses.includes(booking.status);
  const canDownload = booking.latestPayment?.status === "SUCCESS";
  const imageUrl = resolveMediaUrl(booking.apartment.mainImage);

  return (
    <div className="min-h-screen bg-warm-ivory pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/apartments"
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Browse more stays
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-soft-gold font-semibold mb-2">
              Your booking
            </p>
            <h1 className="font-display text-3xl font-semibold text-forest-green">
              {booking.apartment.title}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-charcoal/50 mt-1">
              <MapPin size={13} />
              {booking.apartment.location}, {booking.apartment.city}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles[booking.status]}`}
          >
            {booking.status === "CONFIRMED" || booking.status === "COMPLETED" ? (
              <CheckCircle2 size={13} />
            ) : booking.status === "CANCELLED" ||
              booking.status === "DECLINED" ||
              booking.status === "EXPIRED" ? (
              <XCircle size={13} />
            ) : (
              <Clock size={13} />
            )}
            {booking.status.replace("_", " ")}
          </span>
        </div>

        {actionMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{actionMessage}</span>
          </div>
        )}
        {actionError && (
          <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm overflow-hidden">
              {imageUrl && (
                <div className="relative h-44 w-full bg-charcoal/5">
                  <Image
                    src={imageUrl}
                    alt={booking.apartment.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Detail
                    icon={<CalendarDays size={15} />}
                    label="Check-in"
                    value={formatShortDate(booking.checkIn)}
                  />
                  <Detail
                    icon={<CalendarDays size={15} />}
                    label="Check-out"
                    value={formatShortDate(booking.checkOut)}
                  />
                  <Detail
                    icon={<Users size={15} />}
                    label="Guests"
                    value={`${booking.numberOfGuests} guest${
                      booking.numberOfGuests !== 1 ? "s" : ""
                    }`}
                  />
                  <Detail
                    icon={<Clock size={15} />}
                    label="Nights"
                    value={`${booking.numberOfNights} night${
                      booking.numberOfNights !== 1 ? "s" : ""
                    }`}
                  />
                </div>

                <div className="mt-5 pt-5 border-t border-charcoal/10 grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                      Booking reference
                    </p>
                    <p className="font-medium text-charcoal">
                      {booking.bookingReference}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                      Lead guest
                    </p>
                    <p className="font-medium text-charcoal">
                      {booking.guest.fullName}
                    </p>
                  </div>
                  {booking.guest.email && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                        Email
                      </p>
                      <p className="text-charcoal/70">{booking.guest.email}</p>
                    </div>
                  )}
                  {booking.guest.phone && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                        Phone
                      </p>
                      <p className="text-charcoal/70">{booking.guest.phone}</p>
                    </div>
                  )}
                </div>

                {(booking.guest.specialRequests ||
                  booking.guest.additionalNotes ||
                  booking.guest.arrivalTime) && (
                  <div className="mt-5 pt-5 border-t border-charcoal/10 space-y-3 text-sm">
                    {booking.guest.arrivalTime && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                          Arrival time
                        </p>
                        <p className="text-charcoal/70">
                          {booking.guest.arrivalTime}
                        </p>
                      </div>
                    )}
                    {booking.guest.specialRequests && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                          Special requests
                        </p>
                        <p className="text-charcoal/70">
                          {booking.guest.specialRequests}
                        </p>
                      </div>
                    )}
                    {booking.guest.additionalNotes && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                          Additional notes
                        </p>
                        <p className="text-charcoal/70">
                          {booking.guest.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {booking.cancellationReason && (
                  <div className="mt-5 pt-5 border-t border-charcoal/10 text-sm">
                    <p className="text-xs uppercase tracking-wide text-charcoal/40 mb-1">
                      Cancellation reason
                    </p>
                    <p className="text-charcoal/70">
                      {booking.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {showCancel && (
              <section className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
                <h2 className="font-display text-lg font-semibold text-forest-green mb-1">
                  Cancel this booking
                </h2>
                <p className="text-xs text-charcoal/50 mb-4">
                  Refunds, if any, follow our{" "}
                  <Link
                    href="/refund-policy"
                    className="underline hover:text-forest-green"
                  >
                    cancellation policy
                  </Link>
                  .
                </p>
                <form onSubmit={handleCancel}>
                  <label
                    htmlFor="cancel-reason"
                    className="block text-sm font-medium text-charcoal mb-1.5"
                  >
                    Reason for cancellation
                  </label>
                  <textarea
                    id="cancel-reason"
                    required
                    rows={3}
                    maxLength={500}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tell us why you need to cancel."
                    className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
                  />
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={cancelling}
                      disabled={cancelling}
                    >
                      Confirm cancellation
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowCancel(false);
                        setCancelReason("");
                      }}
                    >
                      Keep booking
                    </Button>
                  </div>
                </form>
              </section>
            )}
          </div>

          <aside className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6 md:sticky md:top-24">
            <h2 className="font-display text-lg font-semibold text-forest-green mb-4">
              Payment summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-charcoal/70">
                <span>
                  {formatPrice(booking.nightlyPriceSnapshot)} ×{" "}
                  {booking.numberOfNights} night
                  {booking.numberOfNights !== 1 ? "s" : ""}
                </span>
                <span>{formatPrice(booking.accommodationSubtotal)}</span>
              </div>
              {booking.cleaningFeeSnapshot !== null && (
                <div className="flex justify-between text-charcoal/70">
                  <span>Cleaning fee</span>
                  <span>{formatPrice(booking.cleaningFeeSnapshot)}</span>
                </div>
              )}
              {booking.additionalFeesSnapshot !== null && (
                <div className="flex justify-between text-charcoal/70">
                  <span>Additional fees</span>
                  <span>{formatPrice(booking.additionalFeesSnapshot)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-charcoal border-t border-charcoal/10 pt-3">
                <span>Total</span>
                <span className="text-forest-green">
                  {formatPrice(booking.totalAmount)}
                </span>
              </div>
            </div>

            {booking.status === "PENDING" &&
              booking.expiresAt &&
              new Date(booking.expiresAt) > new Date() && (
                <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  Dates held until{" "}
                  {new Date(booking.expiresAt).toLocaleTimeString("en-NG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  . Complete payment to confirm.
                </p>
              )}

            <div className="mt-5 space-y-3">
              {canPay && (
                <Button
                  variant="primary"
                  fullWidth
                  loading={paying}
                  disabled={paying}
                  onClick={handlePay}
                >
                  <Lock size={15} />
                  Pay {formatPrice(booking.totalAmount)}
                </Button>
              )}

              {canDownload && (
                <Button
                  variant="secondary"
                  fullWidth
                  loading={downloading}
                  disabled={downloading}
                  onClick={handleDownloadReceipt}
                >
                  <Download size={15} />
                  Download receipt
                </Button>
              )}

              {canCancel && !showCancel && (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setShowCancel(true);
                    setActionError(null);
                  }}
                >
                  Cancel booking
                </Button>
              )}

              {booking.status === "CONFIRMED" && (
                <p className="flex items-start gap-2 text-xs text-charcoal/50">
                  <ReceiptText size={14} className="shrink-0 mt-0.5" />
                  A receipt is attached to your confirmation email.
                </p>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-charcoal/10 text-xs text-charcoal/40 space-y-2">
              <p className="flex items-start gap-2">
                <ShieldIcon />
                Keep this access link private. Anyone with it can view this
                booking.
              </p>
              <p>Need help? hello@nestora.ng</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-soft-gold mt-0.5">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-charcoal/40">
          {label}
        </p>
        <p className="font-medium text-charcoal">{value}</p>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return <Lock size={13} className="shrink-0 mt-0.5" />;
}

export default function ManageBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-ivory pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
        </div>
      }
    >
      <ManageBookingInner />
    </Suspense>
  );
}

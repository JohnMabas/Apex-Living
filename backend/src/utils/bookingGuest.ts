/**
 * Helpers for reading traveller details from either a guest booking (no
 * account) or a legacy account booking. Keeps the fallback logic consistent
 * across booking, payment and email services.
 */

export interface BookingGuestSource {
  guestFirstName?: string | null;
  guestLastName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guest?: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export function guestName(source: BookingGuestSource): string {
  if (source.guest?.fullName?.trim()) return source.guest.fullName.trim();
  const parts = [source.guestFirstName, source.guestLastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.join(" ") || "Guest";
}

export function guestFirstName(source: BookingGuestSource): string | null {
  const explicit = source.guestFirstName?.trim();
  if (explicit) return explicit;
  const full = source.guest?.fullName?.trim();
  if (!full) return null;
  const [first] = full.split(/\s+/);
  return first || null;
}

export function guestLastName(source: BookingGuestSource): string | null {
  const explicit = source.guestLastName?.trim();
  if (explicit) return explicit;
  const full = source.guest?.fullName?.trim();
  if (!full) return null;
  const parts = full.split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : null;
}

export function guestEmail(source: BookingGuestSource): string | null {
  return source.guestEmail?.trim() || source.guest?.email?.trim() || null;
}

export function guestPhone(source: BookingGuestSource): string | null {
  return source.guestPhone?.trim() || source.guest?.phone?.trim() || null;
}

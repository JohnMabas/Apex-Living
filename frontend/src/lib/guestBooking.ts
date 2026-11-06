const STORAGE_PREFIX = "nestora_booking_token_";

function storageKey(bookingReference: string): string {
  return `${STORAGE_PREFIX}${bookingReference.toUpperCase()}`;
}

/** Persist the guest's booking access token for this browser tab. */
export function storeBookingToken(
  bookingReference: string,
  accessToken: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(bookingReference), accessToken);
  } catch {
    // Storage can be unavailable (private mode). The token still travels in
    // the URL, so the booking remains accessible for this session.
  }
}

export function getStoredBookingToken(
  bookingReference: string,
): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(storageKey(bookingReference));
  } catch {
    return null;
  }
}

export function clearBookingToken(bookingReference: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(storageKey(bookingReference));
  } catch {
    // Ignore storage failures.
  }
}

const PAYMENT_STORAGE_PREFIX = "nestora_payment_token_";

function paymentStorageKey(paymentReference: string): string {
  return `${PAYMENT_STORAGE_PREFIX}${paymentReference.toUpperCase()}`;
}

/** Remember the booking token against a payment reference for the redirect back. */
export function storePaymentToken(
  paymentReference: string,
  accessToken: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      paymentStorageKey(paymentReference),
      accessToken,
    );
  } catch {
    // Ignore storage failures; the callback URL still carries the token.
  }
}

export function getPaymentToken(paymentReference: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(paymentStorageKey(paymentReference));
  } catch {
    return null;
  }
}

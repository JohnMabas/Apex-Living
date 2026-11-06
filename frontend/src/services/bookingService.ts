import type {
  AvailabilityResult,
  Booking,
  BookingListResult,
  BookingStatus,
  PaginationMeta,
} from "@/types";
import { apiFetch } from "./apiClient";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQuery(
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

type ListResponse = {
  status: "success";
  data: { bookings: Booking[] };
  meta: PaginationMeta;
};

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export async function checkAvailability(params: {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
}): Promise<AvailabilityResult> {
  const response = await apiFetch<{ data: AvailabilityResult }>(
    "/bookings/check-availability",
    { method: "POST", body: params },
  );
  return response.data;
}

export async function getApartmentBlockedDates(
  apartmentId: string,
): Promise<{ checkIn: string; checkOut: string }[]> {
  const response = await apiFetch<{
    data: { blockedDates: { checkIn: string; checkOut: string }[] };
  }>(`/apartments/${encodeURIComponent(apartmentId)}/availability`);
  return response.data.blockedDates;
}

// ---------------------------------------------------------------------------
// Guest bookings
// ---------------------------------------------------------------------------

export async function createBooking(params: {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
}): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    "/bookings",
    { method: "POST", body: params },
  );
  return response.data.booking;
}

export async function getMyBookings(params: {
  status?: BookingStatus | "";
  page?: number;
  limit?: number;
} = {}): Promise<BookingListResult> {
  const query = buildQuery({
    status: params.status,
    page: params.page,
    limit: params.limit,
  });
  const response = await apiFetch<ListResponse>(`/bookings/my-bookings${query}`);
  return { bookings: response.data.bookings, meta: response.meta };
}

export async function getMyBooking(id: string): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    `/bookings/${encodeURIComponent(id)}`,
  );
  return response.data.booking;
}

export async function cancelMyBooking(
  id: string,
  reason: string,
): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    `/bookings/${encodeURIComponent(id)}/cancel`,
    { method: "PATCH", body: { reason } },
  );
  return response.data.booking;
}

// ---------------------------------------------------------------------------
// Host bookings
// ---------------------------------------------------------------------------

export async function getHostBookings(params: {
  status?: BookingStatus | "";
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<BookingListResult> {
  const query = buildQuery({
    status: params.status,
    search: params.search,
    page: params.page,
    limit: params.limit,
  });
  const response = await apiFetch<ListResponse>(`/host/bookings${query}`);
  return { bookings: response.data.bookings, meta: response.meta };
}

export async function getHostBooking(id: string): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    `/host/bookings/${encodeURIComponent(id)}`,
  );
  return response.data.booking;
}

export async function acceptHostBooking(id: string): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    `/host/bookings/${encodeURIComponent(id)}/accept`,
    { method: "PATCH" },
  );
  return response.data.booking;
}

export async function declineHostBooking(
  id: string,
  reason: string,
): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    `/host/bookings/${encodeURIComponent(id)}/decline`,
    { method: "PATCH", body: { reason } },
  );
  return response.data.booking;
}

// ---------------------------------------------------------------------------
// Admin bookings
// ---------------------------------------------------------------------------

export async function getAdminBookings(params: {
  status?: BookingStatus | "";
  search?: string;
  guestId?: string;
  apartmentId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<BookingListResult> {
  const query = buildQuery({
    status: params.status,
    search: params.search,
    guestId: params.guestId,
    apartmentId: params.apartmentId,
    page: params.page,
    limit: params.limit,
  });
  const response = await apiFetch<ListResponse>(`/admin/bookings${query}`);
  return { bookings: response.data.bookings, meta: response.meta };
}

export async function getAdminBooking(id: string): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    `/admin/bookings/${encodeURIComponent(id)}`,
  );
  return response.data.booking;
}

export async function adminChangeBookingStatus(
  id: string,
  status: BookingStatus,
  note?: string,
): Promise<Booking> {
  const response = await apiFetch<{ data: { booking: Booking } }>(
    `/admin/bookings/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: { status, note } },
  );
  return response.data.booking;
}

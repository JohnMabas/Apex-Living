import type {
  AdminApartmentStats,
  Apartment,
  ApartmentFormValues,
  ApartmentImage,
  ApartmentListResult,
  ApartmentStatus,
  HostApartmentStats,
  PaginationMeta,
  PublicApartmentFilters,
} from "@/types";
import { apiFetch } from "./apiClient";

type ApiListResponse = {
  status: "success";
  data: { apartments: Apartment[] };
  meta: PaginationMeta;
};

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export async function getPublicApartments(
  filters: PublicApartmentFilters = {},
  signal?: AbortSignal,
): Promise<ApartmentListResult> {
  const query = buildQuery({
    city: filters.city,
    location: filters.location,
    search: filters.search,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    bedrooms: filters.bedrooms,
    guests: filters.guests,
    sortBy: filters.sortBy,
    page: filters.page,
    limit: filters.limit,
  });

  const response = await apiFetch<ApiListResponse>(
    `/apartments${query}`,
    { signal },
  );

  return { apartments: response.data.apartments, meta: response.meta };
}

export async function getPublicApartment(id: string): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    `/apartments/${encodeURIComponent(id)}`,
  );
  return response.data.apartment;
}

export async function getAmenities(): Promise<
  { id: string; name: string; slug: string; icon: string | null }[]
> {
  const response = await apiFetch<{
    data: {
      amenities: { id: string; name: string; slug: string; icon: string | null }[];
    };
  }>("/amenities");
  return response.data.amenities;
}

// ---------------------------------------------------------------------------
// Host
// ---------------------------------------------------------------------------

export async function getHostApartments(params: {
  status?: ApartmentStatus | "";
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApartmentListResult> {
  const query = buildQuery({
    status: params.status,
    search: params.search,
    page: params.page,
    limit: params.limit,
  });

  const response = await apiFetch<ApiListResponse>(`/host/apartments${query}`);
  return { apartments: response.data.apartments, meta: response.meta };
}

export async function getHostApartmentStats(): Promise<HostApartmentStats> {
  const response = await apiFetch<{ data: { stats: HostApartmentStats } }>(
    "/host/apartments/stats",
  );
  return response.data.stats;
}

export async function getHostApartment(id: string): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    `/host/apartments/${encodeURIComponent(id)}`,
  );
  return response.data.apartment;
}

export async function createApartment(
  payload: ApartmentFormValues,
): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    "/host/apartments",
    { method: "POST", body: payload },
  );
  return response.data.apartment;
}

export async function updateApartment(
  id: string,
  payload: Partial<ApartmentFormValues>,
): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    `/host/apartments/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload },
  );
  return response.data.apartment;
}

export async function submitApartment(id: string): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    `/host/apartments/${encodeURIComponent(id)}/submit`,
    { method: "POST" },
  );
  return response.data.apartment;
}

export async function archiveHostApartment(id: string): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    `/host/apartments/${encodeURIComponent(id)}/archive`,
    { method: "POST" },
  );
  return response.data.apartment;
}

// ---------------------------------------------------------------------------
// Host images
// ---------------------------------------------------------------------------

export async function uploadApartmentImage(
  apartmentId: string,
  file: File,
  altText?: string,
): Promise<ApartmentImage> {
  const formData = new FormData();
  formData.append("image", file);
  if (altText?.trim()) formData.append("altText", altText.trim());

  const response = await apiFetch<{ data: { image: ApartmentImage } }>(
    `/host/apartments/${encodeURIComponent(apartmentId)}/images`,
    { method: "POST", formData },
  );
  return response.data.image;
}

export async function deleteApartmentImage(
  apartmentId: string,
  imageId: string,
): Promise<void> {
  await apiFetch(
    `/host/apartments/${encodeURIComponent(apartmentId)}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" },
  );
}

export async function setPrimaryApartmentImage(
  apartmentId: string,
  imageId: string,
): Promise<void> {
  await apiFetch(
    `/host/apartments/${encodeURIComponent(apartmentId)}/images/${encodeURIComponent(imageId)}/primary`,
    { method: "PATCH" },
  );
}

export async function reorderApartmentImages(
  apartmentId: string,
  imageIds: string[],
): Promise<void> {
  await apiFetch(
    `/host/apartments/${encodeURIComponent(apartmentId)}/images/reorder`,
    { method: "PATCH", body: { imageIds } },
  );
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getAdminApartments(params: {
  status?: ApartmentStatus | "";
  search?: string;
  hostId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApartmentListResult> {
  const query = buildQuery({
    status: params.status,
    search: params.search,
    hostId: params.hostId,
    page: params.page,
    limit: params.limit,
  });

  const response = await apiFetch<ApiListResponse>(`/admin/apartments${query}`);
  return { apartments: response.data.apartments, meta: response.meta };
}

export async function getAdminApartmentStats(): Promise<AdminApartmentStats> {
  const response = await apiFetch<{ data: { stats: AdminApartmentStats } }>(
    "/admin/apartments/stats",
  );
  return response.data.stats;
}

export async function getAdminApartment(id: string): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    `/admin/apartments/${encodeURIComponent(id)}`,
  );
  return response.data.apartment;
}

async function adminAction(
  id: string,
  action: string,
  body?: Record<string, string>,
): Promise<Apartment> {
  const response = await apiFetch<{ data: { apartment: Apartment } }>(
    `/admin/apartments/${encodeURIComponent(id)}/${action}`,
    { method: "POST", body },
  );
  return response.data.apartment;
}

export function approveApartment(id: string): Promise<Apartment> {
  return adminAction(id, "approve");
}

export function rejectApartment(id: string, reason: string): Promise<Apartment> {
  return adminAction(id, "reject", { reason });
}

export function requestApartmentChanges(
  id: string,
  reason: string,
): Promise<Apartment> {
  return adminAction(id, "request-changes", { reason });
}

export function suspendApartment(id: string, reason: string): Promise<Apartment> {
  return adminAction(id, "suspend", { reason });
}

export function archiveAdminApartment(id: string): Promise<Apartment> {
  return adminAction(id, "archive");
}

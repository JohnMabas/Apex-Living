import type { AvailabilityBlock, AvailabilityData, BlockType } from "@/types";
import { apiFetch } from "./apiClient";

export async function getApartmentAvailability(
  apartmentId: string,
): Promise<AvailabilityData> {
  const response = await apiFetch<{ data: AvailabilityData }>(
    `/apartments/${encodeURIComponent(apartmentId)}/availability`,
  );
  return response.data;
}

export async function getHostApartmentAvailability(
  apartmentId: string,
): Promise<{ blocks: AvailabilityBlock[] }> {
  const response = await apiFetch<{ data: { blocks: AvailabilityBlock[] } }>(
    `/host/apartments/${encodeURIComponent(apartmentId)}/availability`,
  );
  return response.data;
}

export async function blockApartmentDates(
  apartmentId: string,
  data: { startDate: string; endDate: string; reason?: string; blockType?: BlockType },
): Promise<AvailabilityBlock> {
  const response = await apiFetch<{ data: { block: AvailabilityBlock } }>(
    `/host/apartments/${encodeURIComponent(apartmentId)}/availability/block`,
    { method: "POST", body: data },
  );
  return response.data.block;
}

export async function unblockApartmentDates(
  apartmentId: string,
  blockId: string,
): Promise<void> {
  await apiFetch(
    `/host/apartments/${encodeURIComponent(apartmentId)}/availability/block/${encodeURIComponent(blockId)}`,
    { method: "DELETE" },
  );
}

export async function getHostAvailabilityOverview(params: {
  apartmentId?: string;
  limit?: number;
} = {}): Promise<{ blocks: AvailabilityBlock[] }> {
  const search = new URLSearchParams();
  if (params.apartmentId) search.set("apartmentId", params.apartmentId);
  if (params.limit) search.set("limit", String(params.limit));
  const q = search.toString();
  const response = await apiFetch<{ data: { blocks: AvailabilityBlock[] } }>(
    `/host/availability${q ? `?${q}` : ""}`,
  );
  return response.data;
}

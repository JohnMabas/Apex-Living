import type {
  SupportTicket,
  SupportTicketListResult,
  SupportTicketStatus,
  SupportTicketCategory,
  PaginationMeta,
} from "@/types";
import { apiFetch } from "./apiClient";

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

export interface CreateSupportTicketData {
  fullName: string;
  email: string;
  phone?: string;
  bookingReference?: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
}

export async function createSupportTicket(
  data: CreateSupportTicketData,
): Promise<{ ticket: SupportTicket }> {
  const response = await apiFetch<{ data: { ticket: SupportTicket } }>(
    "/support/tickets",
    { method: "POST", body: data },
  );
  return response.data;
}

export async function getAdminTickets(params: {
  status?: SupportTicketStatus | "";
  category?: SupportTicketCategory | "";
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<SupportTicketListResult> {
  const query = buildQuery({
    status: params.status,
    category: params.category,
    search: params.search,
    page: params.page,
    limit: params.limit,
  });
  const response = await apiFetch<{
    status: "success";
    data: { tickets: SupportTicket[] };
    meta: PaginationMeta;
  }>(`/admin/support/tickets${query}`);
  return { tickets: response.data.tickets, meta: response.meta };
}

export async function getAdminTicket(id: string): Promise<SupportTicket> {
  const response = await apiFetch<{ data: { ticket: SupportTicket } }>(
    `/admin/support/tickets/${encodeURIComponent(id)}`,
  );
  return response.data.ticket;
}

export async function addTicketMessage(
  id: string,
  body: string,
  isInternal: boolean,
): Promise<SupportTicket> {
  const response = await apiFetch<{ data: { ticket: SupportTicket } }>(
    `/admin/support/tickets/${encodeURIComponent(id)}/messages`,
    { method: "POST", body: { body, isInternal } },
  );
  return response.data.ticket;
}

export async function assignTicket(
  id: string,
  assignedToId: string,
): Promise<SupportTicket> {
  const response = await apiFetch<{ data: { ticket: SupportTicket } }>(
    `/admin/support/tickets/${encodeURIComponent(id)}/assign`,
    { method: "PATCH", body: { assignedToId } },
  );
  return response.data.ticket;
}

export async function updateTicketStatus(
  id: string,
  status: SupportTicketStatus,
): Promise<SupportTicket> {
  const response = await apiFetch<{ data: { ticket: SupportTicket } }>(
    `/admin/support/tickets/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: { status } },
  );
  return response.data.ticket;
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Headphones,
  Send,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import {
  getAdminTickets,
  getAdminTicket,
  addTicketMessage,
  updateTicketStatus,
} from "@/services/supportService";
import type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketCategory,
} from "@/types";
import { formatShortDate } from "@/lib/format";

const statusColors: Record<SupportTicketStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_FOR_CUSTOMER: "bg-purple-50 text-purple-700 border-purple-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-charcoal/5 text-charcoal/60 border-charcoal/15",
};

const categoryLabels: Record<SupportTicketCategory, string> = {
  BOOKING_ISSUE: "Booking issue",
  PAYMENT_ISSUE: "Payment issue",
  CANCELLATION: "Cancellation",
  REFUND: "Refund",
  APARTMENT_ISSUE: "Apartment issue",
  GENERAL_ENQUIRY: "General enquiry",
};

const statuses: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

function AdminSupportInner() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminTickets({ status: statusFilter, search, page, limit: 20 })
      .then((result) => {
        if (!cancelled) {
          setTickets(result.tickets);
          setTotalPages(result.meta.totalPages);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load support tickets.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, page]);

  async function openTicket(id: string) {
    setTicketLoading(true);
    setActionError(null);
    try {
      const ticket = await getAdminTicket(id);
      setSelectedTicket(ticket);
    } catch {
      setActionError("Could not load ticket details.");
    } finally {
      setTicketLoading(false);
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !message.trim() || sendingMessage) return;
    setSendingMessage(true);
    setActionError(null);
    try {
      const updated = await addTicketMessage(
        selectedTicket.id,
        message.trim(),
        isInternal,
      );
      setSelectedTicket(updated);
      setMessage("");
      setIsInternal(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleStatusChange(newStatus: SupportTicketStatus) {
    if (!selectedTicket) return;
    setActionError(null);
    try {
      const updated = await updateTicketStatus(selectedTicket.id, newStatus);
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  return (
    <div className="min-h-screen bg-warm-ivory pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest-green transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <div className="mb-8">
          <p className="text-sm font-medium text-soft-gold mb-1">Administration</p>
          <h1 className="font-display text-3xl font-semibold text-forest-green">
            Support tickets
          </h1>
        </div>

        {ticketLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-forest-green" />
          </div>
        ) : selectedTicket ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-charcoal/8 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-xs text-charcoal/50">
                    {selectedTicket.ticketReference}
                  </p>
                  <h2 className="font-display text-xl font-semibold text-forest-green mt-1">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-sm text-charcoal/60 mt-1">
                    {categoryLabels[selectedTicket.category]} ·{" "}
                    {selectedTicket.fullName} ({selectedTicket.email})
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[selectedTicket.status]}`}
                >
                  {selectedTicket.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedTicket.status === s
                        ? "bg-forest-green text-warm-ivory border-forest-green"
                        : "border-charcoal/20 text-charcoal/60 hover:bg-charcoal/5"
                    }`}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {actionError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle size={15} /> {actionError}
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-semibold text-charcoal">Conversation</h3>
                {selectedTicket.messages
                  ?.filter((m) => !m.isInternal)
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl border p-4 ${
                        msg.senderType === "CUSTOMER"
                          ? "bg-warm-ivory/40 border-charcoal/8"
                          : "bg-forest-green/5 border-forest-green/10"
                      }`}
                    >
                      <p className="text-xs text-charcoal/50 mb-1">
                        {msg.senderName ?? msg.senderType} ·{" "}
                        {formatShortDate(msg.createdAt)}
                      </p>
                      <p className="text-sm text-charcoal/80 whitespace-pre-line">
                        {msg.body}
                      </p>
                    </div>
                  ))}
              </div>

              {/* Reply form */}
              <form onSubmit={handleSendMessage} className="mt-6 space-y-3">
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your reply…"
                  className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-charcoal/60">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="h-4 w-4 rounded border-charcoal/30 text-forest-green focus:ring-forest-green"
                    />
                    Internal note (not visible to customer)
                  </label>
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg bg-forest-green px-5 py-2.5 text-sm font-medium text-warm-ivory hover:bg-forest-green/90 disabled:opacity-50"
                  >
                    {sendingMessage ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="inline-flex items-center rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5"
                  >
                    Back to list
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by reference, name, email…"
                className="flex-1 rounded-xl border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as SupportTicketStatus | "");
                  setPage(1);
                }}
                className="rounded-xl border border-charcoal/20 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green"
              >
                <option value="">All statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-forest-green" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/60 px-6 py-12 text-center">
                <Headphones size={32} className="mx-auto mb-3 text-forest-green/25" />
                <p className="text-sm font-medium text-charcoal/70">
                  No support tickets found
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-charcoal/8 bg-white shadow-sm">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => openTicket(ticket.id)}
                    className="flex items-center justify-between gap-4 border-b border-charcoal/8 px-5 py-4 last:border-b-0 hover:bg-warm-ivory/40 transition-colors w-full text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal truncate">
                        {ticket.subject}
                      </p>
                      <p className="mt-0.5 text-xs text-charcoal/50">
                        {ticket.ticketReference} · {ticket.fullName} ·{" "}
                        {formatShortDate(ticket.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[ticket.status]}`}
                    >
                      {ticket.status.replace(/_/g, " ")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-charcoal/20 px-4 py-2 text-sm text-charcoal disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-charcoal/50">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-charcoal/20 px-4 py-2 text-sm text-charcoal disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <RequireAuth adminOnly>
      <AdminSupportInner />
    </RequireAuth>
  );
}

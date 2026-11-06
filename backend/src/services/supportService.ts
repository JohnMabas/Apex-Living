import { SupportTicketStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendEmail } from "./emailService.js";
import type {
  AdminTicketQuery,
  AddTicketMessageInput,
  CreateSupportTicketInput,
} from "../validators/supportValidators.js";

// ---------------------------------------------------------------------------
// Reference generator — SUPPORT-XXXXXX
// ---------------------------------------------------------------------------

function generateTicketReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SUPPORT-${code}`;
}

async function uniqueTicketReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const ref = generateTicketReference();
    const existing = await prisma.supportTicket.findUnique({
      where: { ticketReference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
  throw new AppError("Could not generate a unique ticket reference.", 500);
}

// ---------------------------------------------------------------------------
// Prisma include / record types
// ---------------------------------------------------------------------------

const ticketMessagesInclude = {
  orderBy: { createdAt: "asc" as const },
  select: {
    id: true,
    body: true,
    senderType: true,
    senderId: true,
    senderName: true,
    isInternal: true,
    createdAt: true,
  },
} satisfies Prisma.SupportTicketMessageFindManyArgs;

const ticketInclude = {
  messages: ticketMessagesInclude,
  author: {
    select: { id: true, fullName: true, email: true },
  },
  assignedTo: {
    select: { id: true, fullName: true },
  },
} satisfies Prisma.SupportTicketInclude;

type TicketWithMessages = Prisma.SupportTicketGetPayload<{
  include: typeof ticketInclude;
}>;

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function serializeTicket(
  ticket: TicketWithMessages,
  options: { includeInternal?: boolean } = {},
) {
  return {
    id: ticket.id,
    ticketReference: ticket.ticketReference,
    fullName: ticket.fullName,
    email: ticket.email,
    phone: ticket.phone,
    bookingReference: ticket.bookingReference,
    category: ticket.category,
    subject: ticket.subject,
    status: ticket.status,
    assignedToId: ticket.assignedToId,
    author: ticket.author
      ? {
          id: ticket.author.id,
          fullName: ticket.author.fullName,
          email: ticket.author.email,
        }
      : null,
    assignedTo: ticket.assignedTo
      ? {
          id: ticket.assignedTo.id,
          fullName: ticket.assignedTo.fullName,
        }
      : null,
    messages: ticket.messages
      .filter((m) => options.includeInternal || !m.isInternal)
      .map((m) => ({
        id: m.id,
        body: m.body,
        senderType: m.senderType,
        senderId: m.senderId,
        senderName: m.senderName,
        isInternal: m.isInternal,
        createdAt: m.createdAt.toISOString(),
      })),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function serializeTicketSummary(ticket: TicketWithMessages) {
  return {
    id: ticket.id,
    ticketReference: ticket.ticketReference,
    fullName: ticket.fullName,
    email: ticket.email,
    category: ticket.category,
    subject: ticket.subject,
    status: ticket.status,
    assignedToId: ticket.assignedToId,
    assignedTo: ticket.assignedTo
      ? { id: ticket.assignedTo.id, fullName: ticket.assignedTo.fullName }
      : null,
    messageCount: ticket.messages.length,
    lastMessageAt: ticket.messages.length
      ? ticket.messages[ticket.messages.length - 1].createdAt.toISOString()
      : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

// ---------------------------------------------------------------------------
// Email: support ticket acknowledgement
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTicketAcknowledgementHtml(data: {
  fullName: string;
  ticketReference: string;
  subject: string;
  category: string;
  message: string;
}): string {
  const categoryLabels: Record<string, string> = {
    BOOKING_ISSUE: "Booking Issue",
    PAYMENT_ISSUE: "Payment Issue",
    CANCELLATION: "Cancellation",
    REFUND: "Refund",
    APARTMENT_ISSUE: "Apartment Issue",
    GENERAL_ENQUIRY: "General Enquiry",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Support Ticket Received — Nestora</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;background:#F4EBDD;margin:0;padding:24px}
  .card{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .header{background:#173D32;color:#F4EBDD;padding:32px;text-align:center}
  .header h1{margin:0;font-size:24px;letter-spacing:.5px}
  .header p{margin:4px 0 0;opacity:.75;font-size:13px}
  .body{padding:32px;color:#252B28}
  .badge{display:inline-block;background:#d1fae5;color:#065f46;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600;margin-bottom:18px}
  .row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #f0ebe3;font-size:14px}
  .row:last-child{border-bottom:none}
  .label{color:#666}
  .value{font-weight:500;text-align:right}
  .quote{background:#f9f5ef;border-left:3px solid #C69B65;padding:12px 16px;margin:16px 0;border-radius:4px;font-size:14px;color:#444}
  .note{margin-top:20px;font-size:13px;color:#666;line-height:1.6}
  .footer{background:#f9f5ef;padding:20px 32px;text-align:center;font-size:12px;color:#999}
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🏠 Nestora Support</h1>
      <p>Your comfort, your space.</p>
    </div>
    <div class="body">
      <p>Hi ${escapeHtml(data.fullName)},</p>
      <span class="badge">✓ Ticket Received</span>
      <p>We have received your support request and our team will get back to you as soon as possible.</p>

      <h2 style="color:#173D32;margin:22px 0 12px;font-size:16px">Ticket Details</h2>
      <div class="row"><span class="label">Ticket reference</span><span class="value">${escapeHtml(data.ticketReference)}</span></div>
      <div class="row"><span class="label">Subject</span><span class="value">${escapeHtml(data.subject)}</span></div>
      <div class="row"><span class="label">Category</span><span class="value">${escapeHtml(categoryLabels[data.category] ?? data.category)}</span></div>

      <h2 style="color:#173D32;margin:22px 0 8px;font-size:16px">Your Message</h2>
      <div class="quote">${escapeHtml(data.message)}</div>

      <p class="note">
        Please keep your ticket reference (${escapeHtml(data.ticketReference)}) for future correspondence.
        If you have additional information, just reply to this email.
      </p>
      <p class="note">
        Need urgent help? Contact us at
        <a href="mailto:hello@nestora.ng" style="color:#173D32">hello@nestora.ng</a>.
      </p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Nestora. All rights reserved. · Your comfort, your space.</div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// createSupportTicket — public, guest tickets have authorId=null
// ---------------------------------------------------------------------------

export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<{ ticket: ReturnType<typeof serializeTicket> }> {
  const ref = await uniqueTicketReference();

  // Try to link to an existing user account by email
  const existingUser = input.email
    ? await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      })
    : null;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketReference: ref,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      bookingReference: input.bookingReference ?? null,
      category: input.category,
      subject: input.subject,
      status: SupportTicketStatus.OPEN,
      authorId: existingUser?.id ?? null,
      messages: {
        create: {
          body: input.message,
          senderType: "CUSTOMER",
          senderName: input.fullName,
          isInternal: false,
        },
      },
    },
    include: ticketInclude,
  });

  // Send acknowledgement email (fire-and-forget)
  void sendEmail({
    to: input.email,
    subject: `Support ticket received — ${ref}`,
    templateName: "support-ticket-acknowledgement",
    html: buildTicketAcknowledgementHtml({
      fullName: input.fullName,
      ticketReference: ref,
      subject: input.subject,
      category: input.category,
      message: input.message,
    }),
  }).catch((error: unknown) => {
    console.error("Failed to send support ticket acknowledgement email:", error);
  });

  return { ticket: serializeTicket(ticket) };
}

// ---------------------------------------------------------------------------
// listAdminTickets — paginated list with filters
// ---------------------------------------------------------------------------

export async function listAdminTickets(query: AdminTicketQuery) {
  const where: Prisma.SupportTicketWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;

  if (query.search) {
    where.OR = [
      {
        ticketReference: { contains: query.search, mode: "insensitive" },
      },
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { subject: { contains: query.search, mode: "insensitive" } },
      { bookingReference: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [tickets, total] = await prisma.$transaction([
    prisma.supportTicket.findMany({
      where,
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets: tickets.map(serializeTicketSummary),
    meta: paginationMeta(query.page, query.limit, total),
  };
}

// ---------------------------------------------------------------------------
// getTicket — get ticket with messages
// ---------------------------------------------------------------------------

export async function getTicket(
  ticketId: string,
  options: { includeInternal?: boolean } = {},
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });

  if (!ticket) throw new AppError("Support ticket not found.", 404);

  return serializeTicket(ticket, options);
}

// ---------------------------------------------------------------------------
// addMessage — add a message, update ticket status
// ---------------------------------------------------------------------------

export async function addMessage(
  ticketId: string,
  input: AddTicketMessageInput,
  senderId?: string,
  senderName?: string,
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });

  if (!ticket) throw new AppError("Support ticket not found.", 404);

  await prisma.$transaction(async (tx) => {
    await tx.supportTicketMessage.create({
      data: {
        ticketId,
        body: input.body,
        senderType: input.senderType,
        senderId: senderId ?? null,
        senderName: senderName ?? null,
        isInternal: input.isInternal,
      },
    });

    // Update ticket status based on message type
    let newStatus = ticket.status;

    if (!input.isInternal) {
      if (input.senderType === "CUSTOMER") {
        newStatus = SupportTicketStatus.OPEN;
      } else {
        // Admin/staff reply — waiting for customer
        if (ticket.status === SupportTicketStatus.OPEN) {
          newStatus = SupportTicketStatus.WAITING_FOR_CUSTOMER;
        }
      }
    }

    if (newStatus !== ticket.status) {
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: newStatus },
      });
    }
  });

  const updatedTicket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });

  return serializeTicket(updatedTicket!, { includeInternal: true });
}

// ---------------------------------------------------------------------------
// assignTicket — assign to admin
// ---------------------------------------------------------------------------

export async function assignTicket(
  ticketId: string,
  assignedToId: string | undefined,
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });

  if (!ticket) throw new AppError("Support ticket not found.", 404);

  let assignee: { id: string; fullName: string } | null = null;

  if (assignedToId) {
    const admin = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, fullName: true, role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      throw new AppError("You can only assign tickets to admin users.", 400);
    }

    assignee = { id: admin.id, fullName: admin.fullName };
  }

  const updateData: Prisma.SupportTicketUpdateInput = {
    assignedTo: assignedToId ? { connect: { id: assignedToId } } : { disconnect: true },
  };

  if (
    assignedToId &&
    ticket.status === SupportTicketStatus.OPEN
  ) {
    updateData.status = SupportTicketStatus.IN_PROGRESS;
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  const updated = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });

  return serializeTicket(updated!, { includeInternal: true });
}

// ---------------------------------------------------------------------------
// updateTicketStatus — update status
// ---------------------------------------------------------------------------

export async function updateTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
  assignedToId?: string,
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!ticket) throw new AppError("Support ticket not found.", 404);

  const updateData: Prisma.SupportTicketUpdateInput = {
    status,
  };

  if (assignedToId !== undefined) {
    if (assignedToId) {
      const admin = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, role: true },
      });
      if (!admin || admin.role !== "ADMIN") {
        throw new AppError("You can only assign tickets to admin users.", 400);
      }
      updateData.assignedTo = { connect: { id: assignedToId } };
    } else {
      updateData.assignedTo = { disconnect: true };
    }
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  const updated = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });

  return serializeTicket(updated!, { includeInternal: true });
}

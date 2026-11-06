/**
 * Minimal, dependency-free PDF writer for booking receipts.
 * Supports a single page of left-aligned text using the standard Helvetica
 * fonts, which is all the receipt needs. Keeping this local avoids adding a
 * large PDF dependency for one document type.
 */

interface TextLine {
  text: string;
  size?: number;
  bold?: boolean;
  gapBefore?: number;
}

export interface ReceiptPdfData {
  guestName: string;
  bookingReference: string;
  paymentReference: string;
  apartmentTitle: string;
  apartmentLocation: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  nightlyPrice: number;
  cleaningFee: number | null;
  additionalFees: number | null;
  totalAmount: number;
  currency: string;
  paidAt: string;
}

function ascii(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfText(value: string): string {
  return ascii(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function money(amount: number): string {
  return `NGN ${Math.round(amount).toLocaleString("en-NG")}`;
}

function buildContentStream(data: ReceiptPdfData): string {
  const lines: TextLine[] = [
    { text: "NESTORA", size: 22, bold: true },
    { text: "Your comfort, your space.", size: 10, gapBefore: 4 },
    { text: "Payment Receipt", size: 16, bold: true, gapBefore: 26 },
    { text: `Receipt for ${data.guestName}`, size: 11, gapBefore: 6 },
    { text: "", size: 6 },
    { text: "Booking Details", size: 13, bold: true, gapBefore: 18 },
    { text: `Apartment: ${data.apartmentTitle}` },
    { text: `Location: ${data.apartmentLocation}` },
    { text: `Booking reference: ${data.bookingReference}` },
    { text: `Check-in: ${data.checkIn}` },
    { text: `Check-out: ${data.checkOut}` },
    { text: `Guests: ${data.numberOfGuests}` },
    { text: `Nights: ${data.numberOfNights}` },
    { text: "", size: 6 },
    { text: "Payment Summary", size: 13, bold: true, gapBefore: 18 },
    {
      text: `Accommodation (${money(data.nightlyPrice)} x ${data.numberOfNights}): ${money(
        data.nightlyPrice * data.numberOfNights,
      )}`,
    },
  ];

  if (data.cleaningFee !== null) {
    lines.push({ text: `Cleaning fee: ${money(data.cleaningFee)}` });
  }
  if (data.additionalFees !== null) {
    lines.push({ text: `Additional fees: ${money(data.additionalFees)}` });
  }

  lines.push(
    {
      text: `Total paid: ${money(data.totalAmount)} ${data.currency}`,
      size: 13,
      bold: true,
      gapBefore: 8,
    },
    {
      text: `Payment reference: ${data.paymentReference}`,
      gapBefore: 16,
    },
    { text: `Payment date: ${data.paidAt}` },
    { text: "", size: 6 },
    {
      text: "Thank you for choosing Nestora. For support, email hello@nestora.ng.",
      size: 9,
      gapBefore: 28,
    },
  );

  let y = 800;
  const parts: string[] = ["BT"];
  for (const line of lines) {
    y -= line.gapBefore ?? 16;
    const font = line.bold ? "/F2" : "/F1";
    const size = line.size ?? 10;
    parts.push("1 0 0 1 56 " + y.toFixed(2) + " Tm");
    parts.push(`${font} ${size} Tf`);
    parts.push(`(${escapePdfText(line.text)}) Tj`);
  }
  parts.push("ET");
  return parts.join("\n");
}

export function buildReceiptPdf(data: ReceiptPdfData): Buffer {
  const content = buildContentStream(data);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];

  const header = "%PDF-1.4\n";
  const chunks: string[] = [header];
  const offsets: number[] = [];
  let cursor = Buffer.byteLength(header, "latin1");

  objects.forEach((object, index) => {
    const objectString = `${index + 1} 0 obj\n${object}\nendobj\n`;
    offsets.push(cursor);
    chunks.push(objectString);
    cursor += Buffer.byteLength(objectString, "latin1");
  });

  const xrefOffset = cursor;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map(
      (offset) => `${offset.toString().padStart(10, "0")} 00000 n `,
    ),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  chunks.push(xref);
  return Buffer.from(chunks.join(""), "latin1");
}

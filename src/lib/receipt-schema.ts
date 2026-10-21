import { z } from "zod";

// Browser-safe shared rules for receipt files, extraction and review.

export const RECEIPT_BUCKET = "receipt-files";
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_RECEIPT_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
} as const;
export type ReceiptMime = keyof typeof ACCEPTED_RECEIPT_TYPES;

export function validateReceiptFile(file: { name: string; type: string; size: number }): string | null {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const expectedExt = Object.hasOwn(ACCEPTED_RECEIPT_TYPES, file.type)
    ? ACCEPTED_RECEIPT_TYPES[file.type as ReceiptMime]
    : undefined;
  const matchesType = expectedExt === ext || (expectedExt === "jpg" && ext === "jpeg");
  if (!matchesType) return "Unsupported file. Please upload a JPG, JPEG, PNG or PDF.";
  if (file.size <= 0) return "This file is empty.";
  if (file.size > MAX_RECEIPT_BYTES) return "File is larger than 10 MB.";
  return null;
}

/** Detects the real file type from its first bytes (server-side check). */
export function sniffReceiptMime(bytes: Uint8Array): ReceiptMime | null {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

const money = z.number().finite().nonnegative().max(1e11).nullable();

/** Shape the AI must return. Every value may be null when not readable. */
export const extractionSchema = z.object({
  is_receipt: z.boolean(),
  merchant_name: z.string().max(300).nullable(),
  receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  subtotal: money,
  tax_amount: money,
  total_amount: money,
  items: z.array(z.object({
    description: z.string().max(500),
    quantity: z.number().finite().positive().max(1e6).nullable(),
    unit_price: money,
    line_total: money,
  })).max(200),
  uncertain_fields: z.array(z.string().max(60)).max(50),
  notes: z.string().max(1000).nullable(),
});
export type Extraction = z.infer<typeof extractionSchema>;

export const REVIEW_FIELDS = ["merchant_name", "receipt_date", "currency", "subtotal", "tax_amount", "total_amount"] as const;
export type ReviewField = (typeof REVIEW_FIELDS)[number];
export type FieldSource = "extracted" | "corrected" | "missing";

export const reviewSchema = z.object({
  receiptId: z.string().uuid(),
  fields: z.object({
    merchant_name: z.string().trim().max(300).nullable(),
    receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.").nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code like INR.").nullable(),
    subtotal: money,
    tax_amount: money,
    total_amount: money,
  }),
  items: z.array(z.object({
    description: z.string().trim().min(1, "Every item needs a description.").max(500),
    quantity: z.number().finite().positive("Quantity must be above 0.").max(1e6),
    unit_price: money,
    line_total: money,
  })).max(200),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/** Compares a saved value against what the AI read. */
export function fieldSource(value: string | number | null, extracted: string | number | null | undefined): FieldSource {
  if (value === null || value === "") return "missing";
  if (extracted === null || extracted === undefined) return "corrected";
  if (typeof value === "number" && typeof extracted === "number") return Math.abs(value - extracted) < 0.005 ? "extracted" : "corrected";
  return String(value).trim() === String(extracted).trim() ? "extracted" : "corrected";
}

const TOLERANCE = 0.05;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Arithmetic checks shown to the reviewer. Missing values are skipped, never assumed. */
export function calculationWarnings(r: {
  subtotal: number | null; tax_amount: number | null; total_amount: number | null;
  items: { quantity: number | null; unit_price: number | null; line_total: number | null; description: string }[];
}): string[] {
  const out: string[] = [];
  r.items.forEach((i, idx) => {
    if (i.quantity != null && i.unit_price != null && i.line_total != null) {
      const expected = round2(i.quantity * i.unit_price);
      if (Math.abs(expected - i.line_total) > TOLERANCE) out.push(`Item ${idx + 1} (${i.description || "unnamed"}): ${i.quantity} × ${i.unit_price} = ${expected}, but line total is ${i.line_total}.`);
    }
  });
  const lines = r.items.map((i) => i.line_total);
  if (r.subtotal != null && lines.length > 0 && lines.every((l) => l != null)) {
    const sum = round2(lines.reduce<number>((a, b) => a + (b ?? 0), 0));
    if (Math.abs(sum - r.subtotal) > TOLERANCE) out.push(`Line totals add up to ${sum}, but subtotal is ${r.subtotal}.`);
  }
  if (r.subtotal != null && r.tax_amount != null && r.total_amount != null) {
    const expected = round2(r.subtotal + r.tax_amount);
    if (Math.abs(expected - r.total_amount) > TOLERANCE) out.push(`Subtotal + tax = ${expected}, but total is ${r.total_amount}. There may be other charges or discounts.`);
  }
  return out;
}

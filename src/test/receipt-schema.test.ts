import { describe, expect, it } from "vitest";
import {
  MAX_RECEIPT_BYTES,
  calculationWarnings,
  extractionSchema,
  sniffReceiptMime,
  validateReceiptFile,
} from "@/lib/receipt-schema";

describe("receipt file validation", () => {
  it.each([
    ["receipt.jpg", "image/jpeg"],
    ["receipt.jpeg", "image/jpeg"],
    ["receipt.png", "image/png"],
    ["receipt.pdf", "application/pdf"],
  ])("accepts %s", (name, type) => {
    expect(validateReceiptFile({ name, type, size: 1024 })).toBeNull();
  });

  it("accepts the 10 MB limit and rejects files above it", () => {
    expect(validateReceiptFile({ name: "receipt.jpg", type: "image/jpeg", size: MAX_RECEIPT_BYTES })).toBeNull();
    expect(validateReceiptFile({ name: "receipt.jpg", type: "image/jpeg", size: MAX_RECEIPT_BYTES + 1 })).toMatch(/10 MB/);
  });

  it("rejects unsupported, mismatched, and empty files", () => {
    expect(validateReceiptFile({ name: "receipt.txt", type: "text/plain", size: 10 })).toMatch(/Unsupported/);
    expect(validateReceiptFile({ name: "receipt.jpg", type: "image/png", size: 10 })).toMatch(/Unsupported/);
    expect(validateReceiptFile({ name: "receipt.pdf", type: "application/pdf", size: 0 })).toMatch(/empty/);
  });

  it("sniffs actual JPEG, PNG, and PDF signatures instead of trusting the filename", () => {
    expect(sniffReceiptMime(new Uint8Array([0xff, 0xd8, 0xff, 0]))).toBe("image/jpeg");
    expect(sniffReceiptMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffReceiptMime(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe("application/pdf");
    expect(sniffReceiptMime(new Uint8Array([0, 1, 2, 3]))).toBeNull();
  });
});

describe("receipt extraction validation", () => {
  it("allows missing values without fabricating data", () => {
    expect(extractionSchema.parse({
      is_receipt: true,
      merchant_name: null,
      receipt_date: null,
      currency: null,
      subtotal: null,
      tax_amount: null,
      total_amount: null,
      items: [],
      uncertain_fields: ["merchant_name"],
      notes: null,
    })).toMatchObject({ merchant_name: null, total_amount: null, items: [] });
  });

  it("flags arithmetic discrepancies and skips checks with missing values", () => {
    expect(calculationWarnings({
      subtotal: 10,
      tax_amount: 1,
      total_amount: 13,
      items: [{ description: "Tea", quantity: 2, unit_price: 5, line_total: 9 }],
    })).toHaveLength(3);

    expect(calculationWarnings({
      subtotal: null,
      tax_amount: null,
      total_amount: null,
      items: [{ description: "Tea", quantity: null, unit_price: 5, line_total: null }],
    })).toEqual([]);
  });
});

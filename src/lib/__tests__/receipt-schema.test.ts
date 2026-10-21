import { describe, expect, it } from "vitest";
import { calculationWarnings, fieldSource, sniffReceiptMime, validateReceiptFile } from "../receipt-schema";

describe("receipt file rules", () => {
  it("rejects files over 10 MB", () => {
    expect(validateReceiptFile({ name: "a.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 })).toMatch(/10 MB/);
  });
  it("accepts a 10 MB jpeg", () => {
    expect(validateReceiptFile({ name: "a.jpeg", type: "image/jpeg", size: 10 * 1024 * 1024 })).toBeNull();
  });
  it("rejects non-receipt types", () => {
    expect(validateReceiptFile({ name: "a.gif", type: "image/gif", size: 100 })).not.toBeNull();
  });
  it("detects real file type from bytes", () => {
    expect(sniffReceiptMime(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe("application/pdf");
    expect(sniffReceiptMime(new TextEncoder().encode("<html>"))).toBeNull();
  });
});

describe("review checks", () => {
  it("flags a total that doesn't equal subtotal + tax", () => {
    expect(calculationWarnings({ subtotal: 100, tax_amount: 5, total_amount: 110, items: [] })).toHaveLength(1);
  });
  it("does not flag when values are missing", () => {
    expect(calculationWarnings({ subtotal: null, tax_amount: 5, total_amount: 110, items: [] })).toHaveLength(0);
  });
  it("labels changed values as corrected", () => {
    expect(fieldSource(120, 110)).toBe("corrected");
    expect(fieldSource(null, 110)).toBe("missing");
    expect(fieldSource("Cafe", "Cafe")).toBe("extracted");
  });
});

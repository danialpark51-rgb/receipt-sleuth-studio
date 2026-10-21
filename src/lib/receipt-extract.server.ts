import { generateResponse, GatewayError, PaymentRequiredError, RateLimitError, ConfigurationError, AuthenticationError } from "@lovable.dev/ai-gateway";
import { extractionSchema, type Extraction, type ReceiptMime } from "./receipt-schema";

const MODEL = "openai/gpt-6-astra" as const;

const nullable = (t: string) => ({ type: [t, "null"] });
const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_receipt", "merchant_name", "receipt_date", "currency", "subtotal", "tax_amount", "total_amount", "items", "uncertain_fields", "notes"],
  properties: {
    is_receipt: { type: "boolean" },
    merchant_name: nullable("string"),
    receipt_date: { ...nullable("string"), description: "YYYY-MM-DD" },
    currency: { ...nullable("string"), description: "ISO 4217 code, e.g. INR, USD" },
    subtotal: nullable("number"),
    tax_amount: { ...nullable("number"), description: "Sum of all taxes (GST, VAT, CGST+SGST, etc.)" },
    total_amount: nullable("number"),
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "quantity", "unit_price", "line_total"],
        properties: {
          description: { type: "string" },
          quantity: nullable("number"),
          unit_price: nullable("number"),
          line_total: nullable("number"),
        },
      },
    },
    uncertain_fields: { type: "array", items: { type: "string" }, description: "Field names that were hard to read or inferred" },
    notes: nullable("string"),
  },
} as const;

const INSTRUCTIONS = `You read receipts and invoices. Return only what is actually printed on the document.
Rules:
- If a value is not visible or not legible, return null. Never guess or calculate a missing value.
- Amounts are plain numbers without currency symbols or thousands separators.
- Only set currency if a symbol, code or clear country context is printed; otherwise null.
- List any field you were unsure about in uncertain_fields (e.g. "total_amount", "items[2].unit_price").
- If the document is not a receipt or invoice, set is_receipt to false and leave other fields null/empty.`;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export type ExtractOutcome =
  | { ok: true; data: Extraction }
  | { ok: false; error: string; configuration?: boolean };

export async function extractReceiptFields(bytes: Uint8Array, mime: ReceiptMime, filename: string): Promise<ExtractOutcome> {
  const dataUrl = `data:${mime};base64,${toBase64(bytes)}`;
  const filePart = mime === "application/pdf"
    ? { type: "input_file" as const, filename, file_data: dataUrl }
    : { type: "input_image" as const, image_url: dataUrl, detail: "high" as const };

  try {
    const res = await generateResponse({
      model: MODEL,
      instructions: INSTRUCTIONS,
      input: [{ role: "user", content: [{ type: "input_text", text: "Extract the receipt fields." }, filePart] }],
      text: { format: { type: "json_schema", name: "receipt_extraction", schema: JSON_SCHEMA, strict: true } },
    });
    const text = outputText(res);
    if (!text) return { ok: false, error: "The reader returned no result. Please try again." };
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return { ok: false, error: "The reader returned an unreadable result. Please try again." }; }
    const result = extractionSchema.safeParse(parsed);
    if (!result.success) return { ok: false, error: "The reader's result didn't match the expected format. Please try again." };
    if (!result.data.is_receipt) return { ok: false, error: "This file doesn't look like a receipt or invoice." };
    return { ok: true, data: result.data };
  } catch (err) {
    if (err instanceof ConfigurationError || err instanceof AuthenticationError) {
      return { ok: false, configuration: true, error: "Receipt reading isn't configured for this app yet." };
    }
    if (err instanceof PaymentRequiredError) return { ok: false, configuration: true, error: "AI credits are used up for this workspace. Add credits, then try again." };
    if (err instanceof RateLimitError) return { ok: false, error: "The reader is busy right now. Please wait a minute and try again." };
    if (err instanceof GatewayError) {
      console.error("receipt extraction failed", { code: err.code, status: err.httpStatus, ids: err.ids });
      return { ok: false, error: "Couldn't read this receipt. Please try again." };
    }
    console.error("receipt extraction failed (non-gateway)", err instanceof Error ? err.name : "unknown");
    return { ok: false, error: "Couldn't read this receipt. Please try again." };
  }
}

function outputText(res: unknown): string | null {
  const r = res as { output_text?: unknown; output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  for (const item of r.output ?? []) {
    if (item.type !== "message") continue;
    for (const c of item.content ?? []) if (c.type === "output_text" && c.text) return c.text;
  }
  return null;
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import {
  MAX_RECEIPT_BYTES, RECEIPT_BUCKET, REVIEW_FIELDS, extractionSchema, fieldSource, reviewSchema, sniffReceiptMime,
  type FieldSource, type ReviewField,
} from "./receipt-schema";

/** Reads an uploaded receipt with AI. All DB/storage access runs as the signed-in user (RLS applies). */
export const extractReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ receiptId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Claim the row; blocks double-processing and rows owned by others (RLS + user_id).
    const { data: row, error: claimErr } = await supabase
      .from("receipts")
      .update({ status: "processing", extraction_error: null })
      .eq("id", data.receiptId)
      .eq("user_id", userId)
      .in("status", ["uploaded", "failed", "extracted"])
      .select("id, file_path, original_filename")
      .maybeSingle();
    if (claimErr) return { ok: false as const, error: "Couldn't start reading this receipt." };
    if (!row) return { ok: false as const, error: "Receipt not found, or it is already being read or has been saved." };

    const fail = async (msg: string, extra?: { configuration?: boolean }) => {
      await supabase.from("receipts").update({ status: "failed", extraction_error: msg }).eq("id", row.id);
      return { ok: false as const, error: msg, configuration: extra?.configuration ?? false };
    };

    if (!row.file_path || !row.file_path.startsWith(`${userId}/`)) return fail("This receipt has no file attached.");

    const { data: blob, error: dlErr } = await supabase.storage.from(RECEIPT_BUCKET).download(row.file_path);
    if (dlErr || !blob) return fail("Couldn't open the uploaded file.");
    if (blob.size > MAX_RECEIPT_BYTES) return fail("File is larger than 10 MB.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mime = sniffReceiptMime(bytes);
    if (!mime) return fail("This file isn't a real JPG, PNG or PDF.");

    const { extractReceiptFields } = await import("./receipt-extract.server");
    const result = await extractReceiptFields(bytes, mime, row.original_filename ?? "receipt");
    if (!result.ok) return fail(result.error, { configuration: result.configuration ?? false });

    const x = result.data;
    const { error: saveErr } = await supabase.from("receipts").update({
      status: "extracted",
      extraction: x as unknown as Json,
      file_mime_type: mime,
    }).eq("id", row.id);
    if (saveErr) return fail("The receipt was read but the result couldn't be saved. Please try again.");
    return { ok: true as const };
  });

/** Saves the reviewed values. Field provenance is recomputed here from the stored AI result. */
export const saveReceiptReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => reviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("receipts").select("id, status, extraction").eq("id", data.receiptId).eq("user_id", userId).maybeSingle();
    if (error || !row) return { ok: false as const, error: "Receipt not found." };
    if (row.status !== "extracted" && row.status !== "processed") return { ok: false as const, error: "This receipt isn't ready for review." };

    const parsed = extractionSchema.safeParse(row.extraction);
    const x = parsed.success ? parsed.data : null;
    const sources = Object.fromEntries(
      REVIEW_FIELDS.map((f) => [f, fieldSource(data.fields[f], x?.[f])]),
    ) as Record<ReviewField, FieldSource>;
    const items = data.items.map((i) => {
      const match = x?.items.find((e) =>
        e.description.trim() === i.description && e.quantity === i.quantity && e.unit_price === i.unit_price && e.line_total === i.line_total);
      return { ...i, source: match ? "extracted" : "corrected" };
    });

    const { error: rpcErr } = await supabase.rpc("save_receipt_review", {
      _receipt_id: data.receiptId,
      _fields: data.fields as unknown as Json,
      _field_sources: sources as unknown as Json,
      _items: items as unknown as Json,
    });
    if (rpcErr) return { ok: false as const, error: "Couldn't save the receipt. Nothing was changed — please try again." };
    return { ok: true as const };
  });

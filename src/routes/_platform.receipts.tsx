import { useEffect, useRef, useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UploadCloud, FileText, Loader2, X, AlertTriangle, CheckCircle2, RotateCcw, Plus, Trash2, ExternalLink, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader, Panel } from "@/components/app/common";
import { supabase } from "@/integrations/supabase/client";
import { extractReceipt, saveReceiptReview } from "@/lib/receipts.functions";
import {
  ACCEPTED_RECEIPT_TYPES, RECEIPT_BUCKET, calculationWarnings, extractionSchema, fieldSource, reviewSchema, validateReceiptFile,
  type Extraction, type ReceiptMime, type ReviewField,
} from "@/lib/receipt-schema";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/receipts")({
  head: () => pageHead("Receipt Intelligence", "Upload receipts, review AI-extracted fields and save verified details."),
  component: ReceiptsPage,
});

type ReceiptRow = {
  id: string; status: string; original_filename: string | null; file_path: string | null; file_mime_type: string | null;
  extraction: unknown; extraction_error: string | null; created_at: string;
  merchant_name: string | null; receipt_date: string | null; currency: string; subtotal: number | null; tax_amount: number | null; total_amount: number | null;
};
const COLS = "id,status,original_filename,file_path,file_mime_type,extraction,extraction_error,created_at,merchant_name,receipt_date,currency,subtotal,tax_amount,total_amount";

function safeRequestErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { name: "UnknownError" };
  const value = error as { name?: unknown; status?: unknown; statusCode?: unknown };
  const status = [value.status, value.statusCode].find(
    (candidate): candidate is number => typeof candidate === "number" && Number.isInteger(candidate),
  );
  return {
    name: typeof value.name === "string" ? value.name : "UnknownError",
    ...(status !== undefined ? { status } : {}),
  };
}

function uploadWithProgress(path: string, file: File, token: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const base = import.meta.env["VITE_SUPABASE_URL"] as string;
    xhr.open("POST", `${base}/storage/v1/object/${RECEIPT_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 413 ? "File is larger than 10 MB." : "Upload failed. Please try again.")));
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection and try again."));
    xhr.send(file);
  });
}

function ReceiptsPage() {
  const input = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const extractFn = useServerFn(extractReceipt);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upload, setUpload] = useState<{ name: string; size: number; pct: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);

  const recent = useQuery({
    queryKey: ["receipts", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("receipts").select(COLS).order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data as ReceiptRow[];
    },
  });
  const selected = recent.data?.find((r) => r.id === selectedId) ?? null;

  const runExtraction = async (id: string) => {
    setReading(true); setConfigMsg(null);
    try {
      const res = await extractFn({ data: { receiptId: id } });
      if (res.ok) toast.success("Receipt read. Please review the details.");
      else { if ("configuration" in res && res.configuration) setConfigMsg(res.error); toast.error(res.error); }
    } catch (requestError) {
      console.error("[receipt-reader] server function request failed", safeRequestErrorDetails(requestError));
      toast.error("Couldn't reach the reader. Please try again.");
    } finally {
      setReading(false);
      await qc.invalidateQueries({ queryKey: ["receipts"] });
    }
  };

  const accept = async (f?: File) => {
    if (!f || upload) return;
    const msg = validateReceiptFile(f);
    if (msg) return setError(msg);
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const { data: sess } = await supabase.auth.getSession();
    const user = userData.user; const token = sess.session?.access_token;
    if (!user || !token) return setError("Your session has expired. Please sign in again.");

    const ext = ACCEPTED_RECEIPT_TYPES[f.type as ReceiptMime];
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    setUpload({ name: f.name, size: f.size, pct: 0 });
    try {
      await uploadWithProgress(path, f, token, (pct) => setUpload((u) => (u ? { ...u, pct } : u)));
      const { data: row, error: insErr } = await supabase.from("receipts").insert({
        user_id: user.id, file_path: path, original_filename: f.name.slice(0, 255), file_mime_type: f.type, file_size_bytes: f.size, status: "uploaded",
      }).select("id").single();
      if (insErr || !row) {
        await supabase.storage.from(RECEIPT_BUCKET).remove([path]);
        throw new Error("Upload saved but the receipt record failed. Please try again.");
      }
      toast.success("Uploaded. Reading the receipt…");
      setSelectedId(row.id);
      await qc.invalidateQueries({ queryKey: ["receipts"] });
      setUpload(null);
      await runExtraction(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setUpload(null);
    } finally {
      if (input.current) input.current.value = "";
    }
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); void accept(e.dataTransfer.files[0]); };

  return (
    <>
      <PageHeader title="Receipt Intelligence" description="Upload a receipt, review what was read, and save verified details." />
      {configMsg && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <Settings2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div><p className="font-medium">Receipt reading unavailable</p><p className="text-muted-foreground">{configMsg} No results were invented — your file is saved and you can try again later.</p></div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Upload">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={cn("flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors", drag ? "border-primary bg-accent" : "border-border")}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><UploadCloud className="h-6 w-6" /></span>
              <p className="mt-4 font-medium">Drag & drop a receipt</p>
              <p className="text-sm text-muted-foreground">JPG, PNG or PDF up to 10 MB</p>
              <Button className="mt-4" onClick={() => input.current?.click()} disabled={!!upload || reading}>Choose file</Button>
              <input ref={input} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="sr-only" aria-label="Upload receipt file" onChange={(e) => void accept(e.target.files?.[0])} />
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            {upload && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border p-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{upload.name}</p>
                  <p className="text-xs text-muted-foreground">{(upload.size / 1024).toFixed(0)} KB · Uploading {upload.pct}%</p>
                  <Progress value={upload.pct} className="mt-2 h-1.5" />
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Your receipts">
            {recent.isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : recent.isError ? (
              <p className="text-sm text-destructive">Couldn't load your receipts.</p>
            ) : !recent.data?.length ? (
              <p className="text-sm text-muted-foreground">No receipts uploaded yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.data.map((r) => (
                  <li key={r.id}>
                    <button onClick={() => setSelectedId(r.id)} className={cn("flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm hover:bg-muted", selectedId === r.id && "bg-accent")}>
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{r.merchant_name || r.original_filename || "Receipt"}</span>
                      <StatusPill status={r.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Review extracted details" className="lg:col-span-3">
          {!selected ? (
            <EmptyState title="No receipt selected" description="Upload a receipt or pick one from your list to review what was read." />
          ) : selected.status === "processing" || (reading && selectedId === selected.id) ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="mt-3 text-sm">Reading the receipt…</p></div>
          ) : selected.status === "uploaded" || selected.status === "failed" ? (
            <div className="py-10 text-center">
              {selected.status === "failed" ? <AlertTriangle className="mx-auto h-8 w-8 text-destructive" /> : <FileText className="mx-auto h-8 w-8 text-muted-foreground" />}
              <p className="mt-3 font-medium">{selected.status === "failed" ? "Reading failed" : "Not read yet"}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{selected.extraction_error ?? "This receipt is uploaded but hasn't been read."}</p>
              <div className="mt-4 flex justify-center gap-2">
                <FileLink path={selected.file_path} />
                <Button onClick={() => void runExtraction(selected.id)} disabled={reading}><RotateCcw className="mr-2 h-4 w-4" />Try again</Button>
              </div>
            </div>
          ) : (
            <ReviewForm key={selected.id + selected.status} receipt={selected} />
          )}
        </Panel>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    uploaded: ["Uploaded", "bg-muted text-muted-foreground"],
    processing: ["Reading", "bg-accent text-primary"],
    extracted: ["Needs review", "bg-warning/15 text-warning"],
    processed: ["Saved", "bg-success/15 text-success"],
    failed: ["Failed", "bg-destructive/10 text-destructive"],
  };
  const [label, cls] = map[status] ?? [status, "bg-muted text-muted-foreground"];
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", cls)}>{label}</span>;
}

function FileLink({ path }: { path: string | null }) {
  const open = async () => {
    if (!path) return;
    const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).createSignedUrl(path, 120);
    if (error || !data) { toast.error("Couldn't open the file."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  return <Button variant="outline" onClick={() => void open()} disabled={!path}><ExternalLink className="mr-2 h-4 w-4" />View file</Button>;
}

type ItemDraft = { description: string; quantity: string; unit_price: string; line_total: string };
const num = (s: string): number | null => { const t = s.trim().replace(/,/g, ""); if (!t) return null; const n = Number(t); return Number.isFinite(n) ? n : NaN; };
const str = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : String(v));

const FIELD_LABELS: Record<ReviewField, string> = {
  merchant_name: "Merchant", receipt_date: "Date (YYYY-MM-DD)", currency: "Currency", subtotal: "Subtotal", tax_amount: "Taxes", total_amount: "Total",
};

function ReviewForm({ receipt }: { receipt: ReceiptRow }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveReceiptReview);
  const parsed = extractionSchema.safeParse(receipt.extraction);
  const x: Extraction | null = parsed.success ? parsed.data : null;
  const saved = receipt.status === "processed";

  const savedItems = useQuery({
    queryKey: ["receipts", "items", receipt.id],
    enabled: saved,
    queryFn: async () => {
      const { data, error } = await supabase.from("receipt_items").select("description,quantity,unit_price,line_total").eq("receipt_id", receipt.id).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const [fields, setFields] = useState<Record<ReviewField, string>>(() => {
    const src = saved ? receipt : x;
    return {
      merchant_name: str(src?.merchant_name), receipt_date: str(src?.receipt_date), currency: str(saved ? receipt.currency : x?.currency),
      subtotal: str(src?.subtotal), tax_amount: str(src?.tax_amount), total_amount: str(src?.total_amount),
    };
  });
  const [items, setItems] = useState<ItemDraft[]>(() =>
    saved ? [] : (x?.items ?? []).map((i) => ({ description: i.description, quantity: str(i.quantity), unit_price: str(i.unit_price), line_total: str(i.line_total) })));
  const [loadedSaved, setLoadedSaved] = useState(!saved);
  useEffect(() => {
    if (saved && savedItems.data && !loadedSaved) {
      setItems(savedItems.data.map((i) => ({ description: i.description, quantity: str(i.quantity), unit_price: str(i.unit_price), line_total: str(i.line_total) })));
      setLoadedSaved(true);
    }
  }, [saved, savedItems.data, loadedSaved]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const numFields = ["subtotal", "tax_amount", "total_amount"] as const;
  const fieldValue = (f: ReviewField) => (numFields.includes(f as (typeof numFields)[number]) ? num(fields[f]) : fields[f].trim() || null);
  const sourceOf = (f: ReviewField) => {
    const v = fieldValue(f);
    return fieldSource(typeof v === "number" && Number.isNaN(v) ? fields[f] : v, x?.[f]);
  };
  const uncertain = new Set(x?.uncertain_fields ?? []);

  const numericItems = items.map((i) => ({ description: i.description, quantity: num(i.quantity), unit_price: num(i.unit_price), line_total: num(i.line_total) }));
  const warnings = calculationWarnings({
    subtotal: num(fields.subtotal), tax_amount: num(fields.tax_amount), total_amount: num(fields.total_amount),
    items: numericItems.map((i) => ({ ...i, quantity: Number.isNaN(i.quantity) ? null : i.quantity, unit_price: Number.isNaN(i.unit_price) ? null : i.unit_price, line_total: Number.isNaN(i.line_total) ? null : i.line_total })),
  });

  const onSave = async () => {
    const bad: string[] = [];
    const n = (label: string, v: number | null) => { if (v !== null && Number.isNaN(v)) bad.push(`${label} must be a number.`); return v !== null && Number.isNaN(v) ? null : v; };
    const payload = {
      receiptId: receipt.id,
      fields: {
        merchant_name: fields.merchant_name.trim() || null,
        receipt_date: fields.receipt_date.trim() || null,
        currency: fields.currency.trim().toUpperCase() || null,
        subtotal: n("Subtotal", num(fields.subtotal)),
        tax_amount: n("Taxes", num(fields.tax_amount)),
        total_amount: n("Total", num(fields.total_amount)),
      },
      items: numericItems.map((i, idx) => ({
        description: i.description.trim(),
        quantity: n(`Item ${idx + 1} quantity`, i.quantity) ?? 1,
        unit_price: n(`Item ${idx + 1} price`, i.unit_price),
        line_total: n(`Item ${idx + 1} line total`, i.line_total),
      })),
    };
    const check = reviewSchema.safeParse(payload);
    if (!check.success) bad.push(...check.error.issues.map((i) => i.message));
    if (bad.length) return setErrors([...new Set(bad)]);
    setErrors([]); setSaving(true);
    try {
      const res = await saveFn({ data: check.data! });
      if (!res.ok) { setErrors([res.error]); return; }
      toast.success("Verified receipt saved.");
      await qc.invalidateQueries({ queryKey: ["receipts"] });
    } catch {
      setErrors(["Couldn't save. Please try again."]);
    } finally {
      setSaving(false);
    }
  };

  if (saved && !loadedSaved) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <Legend cls="bg-accent text-primary" label="Read by AI" /><Legend cls="bg-warning/15 text-warning" label="Edited by you" /><Legend cls="bg-muted text-muted-foreground" label="Not found" />
        </div>
        <FileLink path={receipt.file_path} />
      </div>
      {saved && <p className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Saved as verified. You can still correct and save again.</p>}
      {x?.notes && <p className="mb-4 text-xs text-muted-foreground">Reader note: {x.notes}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(FIELD_LABELS) as ReviewField[]).map((f) => (
          <div key={f} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={f}>{FIELD_LABELS[f]}</Label>
              <span className="flex gap-1">{uncertain.has(f) && <SourceTag cls="bg-destructive/10 text-destructive" label="Unsure" />}<SourceTag {...sourceStyle(sourceOf(f))} /></span>
            </div>
            <Input id={f} value={fields[f]} placeholder="Not found" inputMode={numFields.includes(f as (typeof numFields)[number]) ? "decimal" : undefined}
              maxLength={f === "currency" ? 3 : 300} onChange={(e) => setFields((s) => ({ ...s, [f]: e.target.value }))} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between"><h3 className="text-sm font-semibold">Line items</h3>
        <Button variant="outline" size="sm" onClick={() => setItems((s) => [...s, { description: "", quantity: "1", unit_price: "", line_total: "" }])}><Plus className="mr-1 h-4 w-4" />Add item</Button>
      </div>
      <div className="mt-2 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Item</th><th className="p-2 w-20">Qty</th><th className="p-2 w-28">Price</th><th className="p-2 w-28">Line</th><th className="w-10" /></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No line items found.</td></tr>}
            {items.map((it, idx) => (
              <tr key={idx} className="border-t">
                {(["description", "quantity", "unit_price", "line_total"] as const).map((k) => (
                  <td key={k} className="p-1.5">
                    <Input aria-label={`Item ${idx + 1} ${k.replace("_", " ")}`} value={it[k]} placeholder={k === "description" ? "Description" : "—"} className={cn("h-8", k !== "description" && "font-mono")}
                      onChange={(e) => setItems((s) => s.map((row, j) => (j === idx ? { ...row, [k]: e.target.value } : row)))} />
                  </td>
                ))}
                <td className="p-1.5"><Button variant="ghost" size="icon" aria-label={`Remove item ${idx + 1}`} onClick={() => setItems((s) => s.filter((_, j) => j !== idx))}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" />Calculations don't match</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      {errors.length > 0 && <ul role="alert" className="mt-4 list-disc pl-5 text-sm text-destructive">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => void onSave()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save verified receipt</Button>
      </div>
    </div>
  );
}

function sourceStyle(s: "extracted" | "corrected" | "missing") {
  return s === "extracted" ? { cls: "bg-accent text-primary", label: "AI" } : s === "corrected" ? { cls: "bg-warning/15 text-warning", label: "Edited" } : { cls: "bg-muted text-muted-foreground", label: "Not found" };
}
function SourceTag({ cls, label }: { cls: string; label: string }) {
  return <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", cls)}>{label}</span>;
}
function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-sm", cls)} />{label}</span>;
}

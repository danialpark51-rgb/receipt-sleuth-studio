import { useRef, useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UploadCloud, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DemoBadge, DemoNotice, EmptyState, PageHeader, Panel } from "@/components/app/common";
import { extractedReceipt as r, formatINR } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/receipts")({
  head: () => pageHead("Receipt Intelligence", "Upload receipts and preview extracted fields."),
  component: ReceiptsPage,
});

const ACCEPTED = ["image/png", "image/jpeg", "application/pdf"];
const MAX = 10 * 1024 * 1024;

function ReceiptsPage() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const accept = (f?: File) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setError("Unsupported file. Use PNG, JPG or PDF.");
    if (f.size > MAX) return setError("File is larger than 10 MB.");
    setError(null);
    setFile(f);
    setState("processing");
    // Placeholder: file stays in the browser. Upload + server-side AI extraction comes later.
    setTimeout(() => { setState("done"); toast.success("Demo extraction ready"); }, 1400);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files[0]); };
  const reset = () => { setFile(null); setState("idle"); setError(null); };

  return (
    <>
      <PageHeader title="Receipt Intelligence" description="Upload a receipt to preview structured extraction." actions={<DemoBadge />} />
      <DemoNotice>Files are not uploaded or analysed. The extracted preview always shows the same sample receipt.</DemoNotice>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Upload" className="lg:col-span-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cn("flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors", drag ? "border-primary bg-accent" : "border-border")}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><UploadCloud className="h-6 w-6" /></span>
            <p className="mt-4 font-medium">Drag & drop a receipt</p>
            <p className="text-sm text-muted-foreground">PNG, JPG or PDF up to 10 MB</p>
            <Button className="mt-4" onClick={() => input.current?.click()}>Choose file</Button>
            <input ref={input} type="file" accept={ACCEPTED.join(",")} className="sr-only" aria-label="Upload receipt file" onChange={(e) => accept(e.target.files?.[0])} />
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border p-3">
              <FileText className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · {state === "processing" ? "Processing (demo)…" : "Ready"}</p>
                {state === "processing" && <Progress value={60} className="mt-2 h-1.5" />}
              </div>
              <Button variant="ghost" size="icon" onClick={reset} aria-label="Remove file"><X className="h-4 w-4" /></Button>
            </div>
          )}
        </Panel>

        <Panel title={<span className="flex items-center gap-2">Extracted preview <DemoBadge /></span>} className="lg:col-span-3">
          {state === "idle" && <EmptyState title="No receipt yet" description="Upload a file to see a demonstration of extracted fields." />}
          {state === "processing" && (
            <div className="flex flex-col items-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="mt-3 text-sm">Preparing demo extraction…</p></div>
          )}
          {state === "done" && (
            <div>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[["Merchant", r.merchant], ["Invoice", r.invoice], ["Date", r.date], ["GSTIN", r.gstin], ["Address", r.address], ["Payment", r.payment]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-5 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-3">Item</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Line</th></tr></thead>
                  <tbody>
                    {r.items.map((i) => (
                      <tr key={i.name} className="border-t"><td className="p-3">{i.name}</td><td className="p-3 text-right font-mono">{i.qty}</td><td className="p-3 text-right font-mono">{formatINR(i.price)}</td><td className="p-3 text-right font-mono">{formatINR(i.qty * i.price)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
                <Row k="Subtotal" v={formatINR(r.subtotal)} /><Row k="GST (5%)" v={formatINR(r.tax)} /><Row k="Service charge" v={formatINR(r.serviceCharge)} />
                <div className="border-t pt-1"><Row k="Total" v={formatINR(r.total)} bold /></div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Illustrative extraction confidence: {(r.confidence * 100).toFixed(0)}% (sample value)</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={cn("flex justify-between", bold && "font-semibold")}><span>{k}</span><span className="font-mono">{v}</span></div>;
}

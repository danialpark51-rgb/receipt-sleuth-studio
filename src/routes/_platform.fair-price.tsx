import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge, DemoNotice, EmptyState, PageHeader, Panel } from "@/components/app/common";
import { formatINR } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/fair-price")({
  head: () => pageHead("Traveller Fair-Price", "Compare a quoted price against a demonstration reference range."),
  component: FairPricePage,
});

// Deterministic illustrative range — NOT market data.
function demoRange(product: string, quoted: number) {
  const seed = [...product.toLowerCase()].reduce((a, c) => a + c.charCodeAt(0), 0);
  const mid = Math.max(10, Math.round(quoted * (0.7 + (seed % 40) / 100)));
  return { low: Math.round(mid * 0.85), mid, high: Math.round(mid * 1.15) };
}

function FairPricePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<{ product: string; location: string; quoted: number; low: number; mid: number; high: number } | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const product = String(d.get("product") || "").trim();
    const location = String(d.get("location") || "").trim();
    const quoted = Number(d.get("price"));
    if (!product || !location) return setError("Enter a product and a location.");
    if (!quoted || quoted <= 0) return setError("Enter a quoted price greater than zero.");
    setError(null);
    setLoading(true);
    setTimeout(() => { setRes({ product, location, quoted, ...demoRange(product, quoted) }); setLoading(false); }, 800);
  };

  const verdict = res && (res.quoted > res.high ? { t: "Above demo range", c: "text-destructive" } : res.quoted < res.low ? { t: "Below demo range", c: "text-success" } : { t: "Within demo range", c: "text-primary" });
  const pos = res ? Math.min(100, Math.max(0, ((res.quoted - res.low * 0.8) / (res.high * 1.2 - res.low * 0.8)) * 100)) : 0;

  return (
    <>
      <PageHeader title="Traveller Fair-Price" description="Check whether a quoted price looks reasonable for a location." actions={<DemoBadge />} />
      <DemoNotice>The reference range is generated from your input for demonstration. It does not use live market prices.</DemoNotice>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Price check" className="lg:col-span-2">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5"><Label htmlFor="product">Product or service</Label><Input id="product" name="product" placeholder="e.g. Airport taxi" /></div>
            <div className="space-y-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" placeholder="e.g. Goa" /></div>
            <div className="space-y-1.5"><Label htmlFor="price">Quoted price (₹)</Label><Input id="price" name="price" type="number" inputMode="decimal" min="0" placeholder="1500" /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Compare</Button>
          </form>
        </Panel>
        <Panel title={<span className="flex items-center gap-2">Comparison <DemoBadge /></span>} className="lg:col-span-3">
          {!res ? <EmptyState icon={MapPin} title="No comparison yet" description="Fill in the form to see a demonstration comparison." /> : (
            <div>
              <p className="text-sm text-muted-foreground">{res.product} · {res.location}</p>
              <p className={cn("mt-1 font-display text-2xl font-semibold", verdict!.c)}>{verdict!.t}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[["Low", res.low], ["Typical", res.mid], ["High", res.high]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-mono font-semibold">{formatINR(v as number)}</p></div>
                ))}
              </div>
              <div className="relative mt-8 h-3 rounded-full bg-muted">
                <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: "20%", right: "20%" }} />
                <div className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${pos}%` }} aria-label={`Quoted ${formatINR(res.quoted)}`} />
              </div>
              <p className="mt-3 text-sm">Your quote: <span className="font-mono font-semibold">{formatINR(res.quoted)}</span></p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoBadge, DemoNotice, EmptyState, PageHeader, Panel, RiskBadge, StatusBadge } from "@/components/app/common";
import { ConfirmButton } from "@/components/app/ConfirmButton";
import { duplicatePairs, formatINR, type Receipt } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_platform/duplicates")({
  head: () => pageHead("Duplicate Detection", "Possible duplicate receipts with matching evidence."),
  component: DuplicatesPage,
});

function DuplicatesPage() {
  const [pairs, setPairs] = useState(duplicatePairs);
  const dismiss = (id: string) => { setPairs((p) => p.filter((x) => x.id !== id)); toast.success(`${id} dismissed (demo)`); };
  return (
    <>
      <PageHeader title="Duplicate Detection" description="Pairs of receipts with similar attributes. Similarity scores are illustrative." actions={<DemoBadge />} />
      <DemoNotice />
      {pairs.length === 0 ? <EmptyState title="No possible duplicates" description="All sample pairs have been dismissed." action={<Button variant="outline" onClick={() => setPairs(duplicatePairs)}>Restore samples</Button>} /> : (
        <div className="space-y-6">
          {pairs.map((p) => (
            <Panel key={p.id} title={<span className="flex flex-wrap items-center gap-2">{p.id} <RiskBadge level={p.risk} /></span>} action={<span className="font-display text-xl font-semibold text-primary">{p.similarity}%</span>}>
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.1fr]">
                <ReceiptCard r={p.a} /><ReceiptCard r={p.b} />
                <div className="rounded-xl bg-muted p-4">
                  <p className="mb-3 text-sm font-semibold">Matching evidence</p>
                  <ul className="space-y-2 text-sm">
                    {p.evidence.map((e) => (
                      <li key={e.label} className="flex items-center gap-2">
                        {e.match ? <Check className="h-4 w-4 text-destructive" aria-label="Match" /> : <X className="h-4 w-4 text-muted-foreground" aria-label="No match" />}
                        <span className={e.match ? "" : "text-muted-foreground"}>{e.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <ConfirmButton variant="outline" label="Dismiss" title={`Dismiss ${p.id}?`} description="This marks the pair as not a duplicate in this demo session." onConfirm={() => dismiss(p.id)} />
                <Button onClick={() => toast.info("Investigation creation will be available once the backend is connected.")}>Open investigation</Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

function ReceiptCard({ r }: { r: Receipt }) {
  return (
    <div className="rounded-xl border p-4 text-sm">
      <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{r.id}</span><StatusBadge status={r.status} /></div>
      <p className="mt-2 font-semibold">{r.merchant}</p>
      <p className="font-display text-lg">{formatINR(r.amount)}</p>
      <p className="mt-2 text-xs text-muted-foreground">{r.date} · {r.location}</p>
      <p className="text-xs text-muted-foreground">{r.submittedBy}</p>
    </div>
  );
}

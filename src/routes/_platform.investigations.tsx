import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DemoBadge, DemoNotice, EmptyState, PageHeader, Panel, RiskBadge } from "@/components/app/common";
import { ConfirmButton } from "@/components/app/ConfirmButton";
import { formatINR, investigations, type Investigation } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/investigations")({
  head: () => pageHead("Investigation Center", "Suspicious cases, investigation steps, evidence and reports."),
  component: InvestigationsPage,
});

const statusLabel = { open: "Open", in_review: "In review", escalated: "Escalated", closed: "Closed" };

function InvestigationsPage() {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(investigations[0].id);
  const list = investigations.filter((i) => `${i.title} ${i.subject} ${i.id}`.toLowerCase().includes(q.toLowerCase()));
  const sel = investigations.find((i) => i.id === selectedId) ?? investigations[0];

  return (
    <>
      <PageHeader title="Investigation Center" description="Review suspicious cases and the evidence gathered for each." actions={<DemoBadge />} />
      <DemoNotice>Cases below are fictional examples. Findings require human review and are not determinations of fraud.</DemoNotice>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <Panel title="Cases">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases" className="pl-9" aria-label="Search cases" />
          </div>
          {list.length === 0 ? <EmptyState title="No matching cases" /> : (
            <ul className="space-y-2">
              {list.map((i) => (
                <li key={i.id}>
                  <button onClick={() => setSelectedId(i.id)} className={cn("w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", sel.id === i.id && "border-primary bg-accent")}>
                    <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-muted-foreground">{i.id}</span><RiskBadge level={i.risk} /></div>
                    <p className="mt-1 font-medium">{i.title}</p>
                    <p className="text-xs text-muted-foreground">{i.subject} · {statusLabel[i.status]}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <CaseDetail inv={sel} />
      </div>
    </>
  );
}

function CaseDetail({ inv }: { inv: Investigation }) {
  return (
    <Panel title={<span className="flex flex-wrap items-center gap-2">{inv.title}</span>} action={<RiskBadge level={inv.risk} />}>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Case", inv.id], ["Subject", inv.subject], ["Amount", formatINR(inv.amount)], ["Status", statusLabel[inv.status]]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-medium">{v}</p></div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Investigation steps</h3>
          <ol className="space-y-3">
            {inv.steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                {s.done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                <span className={s.done ? "" : "text-muted-foreground"}>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Evidence</h3>
          <ul className="space-y-2">{inv.evidence.map((e) => <li key={e} className="rounded-lg border p-2.5 text-sm">{e}</li>)}</ul>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Dialog>
          <DialogTrigger asChild><Button variant="outline"><FileText className="mr-2 h-4 w-4" />Preview report</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Report preview · {inv.id}</DialogTitle><DialogDescription>Draft generated from demonstration data.</DialogDescription></DialogHeader>
            <div className="space-y-3 rounded-lg border bg-muted p-4 text-sm">
              <p><strong>Subject:</strong> {inv.subject}</p>
              <p><strong>Amount under review:</strong> {formatINR(inv.amount)}</p>
              <p><strong>Risk level:</strong> {inv.risk}</p>
              <p><strong>Summary:</strong> {inv.summary}</p>
              <div><strong>Evidence:</strong><ul className="ml-5 list-disc">{inv.evidence.map((e) => <li key={e}>{e}</li>)}</ul></div>
              <p className="text-xs text-muted-foreground">DEMO — not a verified finding.</p>
            </div>
          </DialogContent>
        </Dialog>
        <ConfirmButton label="Escalate" title={`Escalate ${inv.id}?`} description="In this preview nothing is sent. Escalation workflows arrive with the backend." onConfirm={() => toast.success(`${inv.id} marked as escalated (demo)`)} />
      </div>
    </Panel>
  );
}

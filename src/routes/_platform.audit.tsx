import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle, AlertCircle, Calculator } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoBadge, DemoNotice, EmptyState, PageHeader, Panel, StatCard } from "@/components/app/common";
import { auditRows, formatINR } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/audit")({
  head: () => pageHead("Expense Audit", "Item calculations, tax checks and total discrepancies."),
  component: AuditPage,
});

const resultMeta = {
  pass: { icon: CheckCircle2, cls: "text-success", label: "Pass" },
  fail: { icon: XCircle, cls: "text-destructive", label: "Discrepancy" },
  review: { icon: AlertCircle, cls: "text-warning", label: "Review" },
};

function AuditPage() {
  const [tab, setTab] = useState<"all" | "pass" | "fail" | "review">("all");
  const rows = auditRows.filter((r) => tab === "all" || r.result === tab);
  const diff = (a: number, b: number) => Math.abs(a - b) >= 1;

  return (
    <>
      <PageHeader title="Expense Audit" description="Recomputed line sums, tax and totals compared with stated values." actions={<DemoBadge />} />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Passed checks" value={String(auditRows.filter((r) => r.result === "pass").length)} icon={CheckCircle2} tone="success" />
        <StatCard label="Needs review" value={String(auditRows.filter((r) => r.result === "review").length)} icon={AlertCircle} tone="warning" />
        <StatCard label="Discrepancies" value={String(auditRows.filter((r) => r.result === "fail").length)} icon={XCircle} tone="destructive" />
      </div>
      <Panel className="mt-6" title="Audit results" action={
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="pass">Pass</TabsTrigger><TabsTrigger value="review">Review</TabsTrigger><TabsTrigger value="fail">Fail</TabsTrigger></TabsList>
        </Tabs>
      }>
        {rows.length === 0 ? <EmptyState icon={Calculator} title="No results in this filter" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="pb-3">Receipt</th><th className="pb-3 text-right">Line sum / Subtotal</th><th className="pb-3 text-right">Tax expected / stated</th><th className="pb-3 text-right">Total expected / stated</th><th className="pb-3 text-right">Result</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const m = resultMeta[r.result];
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="py-3"><p className="font-medium">{r.merchant}</p><p className="text-xs text-muted-foreground">{r.id}</p></td>
                      <Cell a={r.lineSum} b={r.statedSubtotal} bad={diff(r.lineSum, r.statedSubtotal)} />
                      <Cell a={r.taxExpected} b={r.taxStated} bad={diff(r.taxExpected, r.taxStated)} />
                      <Cell a={r.totalExpected} b={r.totalStated} bad={diff(r.totalExpected, r.totalStated)} />
                      <td className="py-3 text-right"><span className={cn("inline-flex items-center gap-1 font-medium", m.cls)}><m.icon className="h-4 w-4" />{m.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Differences under ₹1 are treated as rounding.</p>
      </Panel>
    </>
  );
}

function Cell({ a, b, bad }: { a: number; b: number; bad: boolean }) {
  return (
    <td className="py-3 text-right font-mono">
      {formatINR(a)} / <span className={cn(bad && "font-semibold text-destructive")}>{formatINR(b)}</span>
      {bad && <span className="block text-xs text-destructive">Δ {formatINR(Math.abs(a - b))}</span>}
    </td>
  );
}

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, FileSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DemoBadge, EmptyState, PageHeader, Panel, RiskBadge, StatusBadge } from "@/components/app/common";
import { formatINR, receipts } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_platform/history")({
  head: () => pageHead("Receipt History", "Search and filter all receipt records."),
  component: HistoryPage,
});

const categories = [...new Set(receipts.map((r) => r.category))];

function HistoryPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const rows = useMemo(() => receipts.filter((r) =>
    (status === "all" || r.status === status) &&
    (category === "all" || r.category === category) &&
    `${r.id} ${r.merchant} ${r.submittedBy} ${r.location}`.toLowerCase().includes(q.toLowerCase()),
  ), [q, status, category]);
  const clear = () => { setQ(""); setStatus("all"); setCategory("all"); };

  return (
    <>
      <PageHeader title="Receipt History" description="All submitted receipts across your organisation." actions={<DemoBadge />} />
      <Panel>
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchant, ID, person, city" className="pl-9" aria-label="Search receipts" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-40" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{["verified", "flagged", "pending", "rejected"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-44" aria-label="Filter by category"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{rows.length} of {receipts.length} records</p>
        {rows.length === 0 ? <EmptyState icon={FileSearch} title="No receipts match" description="Try a different search or clear filters." action={<Button variant="outline" onClick={clear}>Clear filters</Button>} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-3">ID</th><th className="pb-3">Merchant</th><th className="pb-3">Category</th><th className="pb-3">Date</th><th className="pb-3">Submitted by</th><th className="pb-3 text-right">Amount</th><th className="pb-3">Status</th><th className="pb-3">Risk</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/50">
                    <td className="py-3 font-mono text-xs">{r.id}</td>
                    <td className="py-3 font-medium">{r.merchant}<span className="block text-xs font-normal text-muted-foreground">{r.location}</span></td>
                    <td className="py-3">{r.category}</td><td className="py-3">{r.date}</td><td className="py-3">{r.submittedBy}</td>
                    <td className="py-3 text-right font-mono">{formatINR(r.amount)}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td><td className="py-3"><RiskBadge level={r.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt as ReceiptIcon, Wallet, AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { DemoBadge, DemoNotice, PageHeader, Panel, RiskBadge, StatCard } from "@/components/app/common";
import { categorySpend, formatINR, investigations, monthlySpend } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_platform/dashboard")({
  head: () => pageHead("Dashboard", "Overview of receipts, analysed expenses, anomalies and risk."),
  component: Dashboard,
});

const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const risk = { critical: 3, high: 9, medium: 21, low: 214 };
  const total = Object.values(risk).reduce((a, b) => a + b, 0);
  return (
    <>
      <PageHeader title="Dashboard" description="Your expense review overview for October 2026." actions={<DemoBadge />} />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receipts processed" value="1,284" hint="+12% vs last month" icon={ReceiptIcon} />
        <StatCard label="Expenses analysed" value={formatINR(2807000)} hint="Last 6 months" icon={Wallet} tone="success" />
        <StatCard label="Anomalies detected" value="33" hint="Sample signals, unverified" icon={AlertTriangle} tone="warning" />
        <StatCard label="Open investigations" value="3" hint="1 escalated" icon={ShieldAlert} tone="destructive" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Monthly spend vs flagged" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpend} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="spend" name="Spend" stroke="var(--chart-1)" strokeWidth={2} fill="url(#spend)" />
                <Area type="monotone" dataKey="flagged" name="Flagged" stroke="var(--chart-4)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Spend by category">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySpend} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {categorySpend.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {categorySpend.map((c, i) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i] }} />{c.name}</span>
                <span className="font-mono text-muted-foreground">{c.value}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Risk summary">
          <div className="space-y-4">
            {(Object.entries(risk) as [keyof typeof risk, number][]).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1.5 flex justify-between text-sm"><RiskBadge level={k} /><span className="font-mono">{v}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (v / total) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent investigations" className="lg:col-span-2" action={<Button asChild variant="ghost" size="sm"><Link to="/investigations">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}>
          <ul className="divide-y">
            {investigations.slice(0, 4).map((inv) => (
              <li key={inv.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.title}</p>
                  <p className="text-xs text-muted-foreground">{inv.id} · {inv.subject} · {inv.opened}</p>
                </div>
                <div className="flex items-center gap-3"><span className="font-mono text-sm">{formatINR(inv.amount)}</span><RiskBadge level={inv.risk} /></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

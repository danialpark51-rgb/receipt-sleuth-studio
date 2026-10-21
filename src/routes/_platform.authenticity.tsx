import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { DemoBadge, DemoNotice, PageHeader, Panel, RiskBadge } from "@/components/app/common";
import { authenticityChecks } from "@/lib/demo-data";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/authenticity")({
  head: () => pageHead("Receipt Authenticity", "Potential alteration indicators with confidence labels."),
  component: AuthenticityPage,
});

function AuthenticityPage() {
  return (
    <>
      <PageHeader title="Receipt Authenticity" description="Indicators that may suggest a receipt was altered. Indicators are not proof of tampering." actions={<DemoBadge />} />
      <DemoNotice>Scores and indicators are illustrative sample values. No image forensics are running.</DemoNotice>
      <div className="grid gap-6 lg:grid-cols-3">
        {authenticityChecks.map((c) => {
          const Icon = c.score >= 85 ? ShieldCheck : c.score >= 60 ? ShieldQuestion : ShieldAlert;
          const tone = c.score >= 85 ? "text-success" : c.score >= 60 ? "text-warning" : "text-destructive";
          return (
            <Panel key={c.id}>
              <div className="flex items-start justify-between">
                <div><p className="font-mono text-xs text-muted-foreground">{c.id}</p><p className="font-semibold">{c.merchant}</p></div>
                <Icon className={cn("h-6 w-6", tone)} aria-hidden />
              </div>
              <div className="mt-5 flex items-end gap-2">
                <span className={cn("font-display text-4xl font-semibold", tone)}>{c.score}</span>
                <span className="mb-1 text-sm text-muted-foreground">/ 100 authenticity confidence</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${c.score}%` }} /></div>
              <div className="mt-3 flex items-center gap-2"><span className="text-sm font-medium">{c.label}</span><RiskBadge level={c.risk} /></div>
              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Indicators</p>
              <ul className="space-y-2">
                {c.indicators.map((i) => (
                  <li key={i.name} className="flex items-start justify-between gap-3 rounded-lg border p-2.5 text-sm">
                    <span>{i.name}</span><RiskBadge level={i.severity} />
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </>
  );
}

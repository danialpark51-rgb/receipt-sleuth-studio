import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FlaskConical, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel, ReceiptStatus } from "@/lib/demo-data";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground", className)}>
      <FlaskConical className="h-3 w-3 text-warning" aria-hidden /> Demo data
    </span>
  );
}

export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      <p>
        <strong className="font-semibold">Demonstration only.</strong>{" "}
        {children ?? "Results on this page are sample data, not verified analysis. No AI, live prices, or fraud detection is connected yet."}
      </p>
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: { label: string; value: string; hint?: string; icon: LucideIcon; tone?: "primary" | "warning" | "destructive" | "success" }) {
  const toneCls = { primary: "bg-accent text-primary", warning: "bg-warning/15 text-warning", destructive: "bg-destructive/10 text-destructive", success: "bg-success/10 text-success" }[tone];
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", toneCls)}><Icon className="h-4 w-4" aria-hidden /></span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const riskCls: Record<RiskLevel, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/15 text-foreground border-warning/40",
  high: "bg-destructive/10 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground border-destructive",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize", riskCls[level])}>{level} risk</span>;
}

const statusCls: Record<ReceiptStatus, string> = {
  verified: "bg-success/10 text-success",
  flagged: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-muted-foreground",
  rejected: "bg-foreground text-background",
};

export function StatusBadge({ status }: { status: ReceiptStatus }) {
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize", statusCls[status])}>{status}</span>;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: { title: string; description?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-gradient font-display text-sm font-bold text-navy-foreground">IQ</span>
      <span className={cn("font-display text-lg font-semibold", inverted ? "text-navy-foreground" : "text-foreground")}>Receipt<span className="text-primary">IQ</span></span>
    </span>
  );
}

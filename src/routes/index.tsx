import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ScanText, Calculator, Copy, ShieldCheck, Siren, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, RiskBadge } from "@/components/app/common";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead("AI Receipt Intelligence & Expense Investigation", "ReceiptIQ reads receipts, audits expenses, spots duplicates and alterations, and organises investigations in one workspace."),
  component: Landing,
});

const features = [
  { icon: ScanText, title: "Receipt Intelligence", text: "Extract merchants, line items, taxes and totals from uploaded receipts." },
  { icon: Calculator, title: "Expense Audit", text: "Recompute item sums, tax and totals to surface discrepancies." },
  { icon: Copy, title: "Duplicate Detection", text: "Compare receipts across submitters to find likely repeat claims." },
  { icon: ShieldCheck, title: "Authenticity Signals", text: "Highlight potential alteration indicators with confidence labels." },
  { icon: Siren, title: "Investigation Center", text: "Track suspicious cases, evidence and reports from one place." },
  { icon: MapPin, title: "Traveller Fair-Price", text: "Compare a quoted price with a reference range for a location." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/signup">Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Autonomous receipt intelligence
            </span>
            <h1 className="text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
              Every receipt, <span className="text-primary">understood</span> and accounted for.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              ReceiptIQ brings extraction, arithmetic audits, duplicate checks and investigation workflows into one calm, auditable workspace for finance teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/dashboard">Explore the demo <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/signup">Create account</Link></Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Preview build — analysis shown uses demonstration data.</p>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-card p-5 shadow-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Investigation INV-2041</p>
                  <p className="font-display font-semibold">Repeated meal claims</p>
                </div>
                <RiskBadge level="critical" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[["Similarity", "97%"], ["Amount", "₹2,480"], ["Receipts", "2"], ["Status", "Escalated"]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-display text-lg font-semibold">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                {["Shared invoice number", "Identical line items", "Submitted one day apart"].map((e) => (
                  <li key={e} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{e}</li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] uppercase tracking-wide text-muted-foreground">Sample data</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="max-w-xl text-3xl font-semibold">One platform for the full expense review lifecycle</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-navy-gradient px-6 py-12 text-navy-foreground sm:px-12">
          <h2 className="text-3xl font-semibold">Reduce review time. Keep humans in control.</h2>
          <p className="mt-3 max-w-xl opacity-80">ReceiptIQ surfaces signals for reviewers — final decisions always stay with your team.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6"><Link to="/dashboard">Open dashboard</Link></Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 ReceiptIQ</footer>
    </div>
  );
}

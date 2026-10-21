import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel } from "@/components/app/common";
import { ConfirmButton } from "@/components/app/ConfirmButton";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_platform/settings")({
  head: () => pageHead("Settings", "Manage your profile, preferences and account."),
  component: SettingsPage,
});

function SettingsPage() {
  const [prefs, setPrefs] = useState({ email: true, weekly: false, highRisk: true });
  const save = (e: FormEvent) => { e.preventDefault(); toast.success("Saved locally for this session (not persisted yet)."); };
  return (
    <>
      <PageHeader title="Settings" description="Changes are not saved to a server in this preview." />
      <Tabs defaultValue="profile">
        <TabsList className="mb-6"><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="preferences">Preferences</TabsTrigger><TabsTrigger value="account">Account</TabsTrigger></TabsList>
        <TabsContent value="profile">
          <Panel title="Profile">
            <form onSubmit={save} className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="fn">Full name</Label><Input id="fn" defaultValue="Demo User" /></div>
              <div className="space-y-1.5"><Label htmlFor="em">Email</Label><Input id="em" type="email" defaultValue="demo@receiptiq.app" /></div>
              <div className="space-y-1.5"><Label htmlFor="role">Role</Label><Input id="role" defaultValue="Finance reviewer" /></div>
              <div className="space-y-1.5"><Label htmlFor="org">Organisation</Label><Input id="org" defaultValue="Acme India Pvt Ltd" /></div>
              <div className="sm:col-span-2"><Button type="submit">Save profile</Button></div>
            </form>
          </Panel>
        </TabsContent>
        <TabsContent value="preferences">
          <Panel title="Preferences">
            <div className="max-w-2xl space-y-5">
              <div className="space-y-1.5">
                <Label>Default currency</Label>
                <Select defaultValue="INR"><SelectTrigger className="w-48" aria-label="Default currency"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="INR">INR — Indian Rupee</SelectItem><SelectItem value="USD">USD — US Dollar</SelectItem><SelectItem value="EUR">EUR — Euro</SelectItem></SelectContent>
                </Select>
              </div>
              {([["email", "Email notifications", "Receive updates about receipts you submit."], ["weekly", "Weekly digest", "A summary of anomalies every Monday."], ["highRisk", "High-risk alerts", "Immediate alerts for critical cases."]] as const).map(([k, t, d]) => (
                <div key={k} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div><Label htmlFor={k}>{t}</Label><p className="text-sm text-muted-foreground">{d}</p></div>
                  <Switch id={k} checked={prefs[k]} onCheckedChange={(v) => setPrefs((p) => ({ ...p, [k]: v }))} />
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>
        <TabsContent value="account">
          <div className="space-y-6">
            <Panel title="Password">
              <form onSubmit={save} className="grid max-w-md gap-4">
                <div className="space-y-1.5"><Label htmlFor="cur">Current password</Label><Input id="cur" type="password" autoComplete="current-password" /></div>
                <div className="space-y-1.5"><Label htmlFor="new">New password</Label><Input id="new" type="password" autoComplete="new-password" /></div>
                <div><Button type="submit">Update password</Button></div>
              </form>
            </Panel>
            <Panel title="Danger zone" className="border-destructive/40">
              <p className="mb-4 text-sm text-muted-foreground">Deleting your account removes all receipts and investigations. This cannot be undone.</p>
              <ConfirmButton variant="destructive" destructive label="Delete account" title="Delete account?" description="This is a preview — nothing will be deleted." confirmLabel="Delete" onConfirm={() => toast.info("Account deletion is not available in the preview.")} />
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

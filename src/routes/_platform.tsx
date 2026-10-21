import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

// Pathless layout for all in-app pages. Auth guard will be added here once
// authentication is connected.
export const Route = createFileRoute("/_platform")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

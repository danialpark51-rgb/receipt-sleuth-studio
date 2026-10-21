import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";

// Pathless layout for all in-app pages. The session lives in browser storage,
// so this gate runs client-side only (ssr: false) and re-validates with Supabase.
export const Route = createFileRoute("/_platform")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

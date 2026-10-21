import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, ScanText, Calculator, Copy, ShieldCheck, Siren, MapPin, History, Settings, Menu, LogOut, Bell, User,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./common";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/receipts", label: "Receipt Intelligence", icon: ScanText },
  { to: "/audit", label: "Expense Audit", icon: Calculator },
  { to: "/duplicates", label: "Duplicate Detection", icon: Copy },
  { to: "/authenticity", label: "Receipt Authenticity", icon: ShieldCheck },
  { to: "/investigations", label: "Investigation Center", icon: Siren },
  { to: "/fair-price", label: "Traveller Fair-Price", icon: MapPin },
  { to: "/history", label: "Receipt History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = path === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted",
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useRouteContext({ from: "/_platform" });
  const email = user.email ?? "";

  // Profile row is protected by RLS: only the owner's own row is returned.
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const displayName = profile?.full_name?.trim() || email;
  const initials = (profile?.full_name?.trim() || email)
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("") || "U";

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Couldn't sign out. Please try again.");
    else toast.success("Signed out.");
    navigate({ to: "/login", replace: true });
  };
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-5 lg:flex">
        <Link to="/" className="mb-8 px-2"><Logo /></Link>
        <NavList />
        <div className="mt-auto rounded-xl bg-navy-gradient p-4 text-navy-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Preview build</p>
          <p className="mt-1 text-sm">Backend & AI not yet connected. All results are demo data.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              <SheetHeader className="mb-4 p-0 text-left"><SheetTitle><Logo /></SheetTitle></SheetHeader>
              <NavList onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-5 w-5" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2" aria-label="Account menu">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">{initials}</span>
                  <span className="hidden max-w-[12rem] truncate text-sm font-medium sm:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="truncate font-normal">
                  <span className="block truncate font-medium">{displayName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}><User className="mr-2 h-4 w-4" />Profile & settings</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

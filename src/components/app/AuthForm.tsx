import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./common";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === "signup";

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setError(null);
    setLoading(true);
    // Placeholder: replace with Lovable Cloud authentication in a later stage.
    setTimeout(() => {
      setLoading(false);
      toast.info("Authentication isn't connected yet — opening the demo workspace.");
      navigate({ to: "/dashboard" });
    }, 700);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/"><Logo /></Link>
          <h1 className="mt-10 text-2xl font-semibold">{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isSignup ? "Start reviewing receipts with ReceiptIQ." : "Sign in to your ReceiptIQ workspace."}</p>
          <div className="mt-6 flex items-start gap-2 rounded-lg border bg-accent px-3 py-2 text-xs text-accent-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Frontend placeholder — sign-in is not connected yet.
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {isSignup && (
              <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" name="name" autoComplete="name" /></div>
            )}
            <div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" autoComplete="email" /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New to ReceiptIQ? "}
            <Link to={isSignup ? "/login" : "/signup"} className="font-medium text-primary hover:underline">{isSignup ? "Sign in" : "Create an account"}</Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-navy-gradient lg:block">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative flex h-full flex-col justify-end p-12 text-navy-foreground">
          <p className="font-display text-3xl font-semibold leading-tight">"Signals for reviewers, decisions for people."</p>
          <p className="mt-3 opacity-75">ReceiptIQ design principle</p>
        </div>
      </div>
    </div>
  );
}

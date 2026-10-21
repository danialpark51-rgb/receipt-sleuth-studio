import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./common";

const emailSchema = z.string().trim().email("Please enter a valid email address.").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(72, "Password must be 72 characters or fewer.");
const nameSchema = z.string().trim().max(200, "Name must be 200 characters or fewer.");

// Only allow same-origin in-app paths as post-login destinations.
function safePath(p?: string) {
  return p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard";
}

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox for the link.";
  if (/already registered/i.test(message)) return "An account with this email already exists. Try signing in.";
  if (/rate limit/i.test(message)) return "Too many attempts. Please wait a few minutes and try again.";
  return message;
}

export function AuthForm({ mode, redirectTo }: { mode: "login" | "signup"; redirectTo?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const isSignup = mode === "signup";
  const destination = safePath(redirectTo);

  // Already signed in? Skip the form.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: destination, replace: true });
    });
  }, [navigate, destination]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(form.get("email") ?? "");
    if (!email.success) return setError(email.error.issues[0].message);
    const password = passwordSchema.safeParse(form.get("password") ?? "");
    if (!password.success) return setError(password.error.issues[0].message);
    const name = nameSchema.safeParse(form.get("name") ?? "");
    if (!name.success) return setError(name.error.issues[0].message);

    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.data,
          password: password.data,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name.data } },
        });
        if (error) throw error;
        // Supabase returns an empty identities list for an already-registered email.
        if (data.user && data.user.identities?.length === 0) {
          throw new Error("An account with this email already exists. Try signing in.");
        }
        if (data.session) {
          toast.success("Account created. Welcome to ReceiptIQ!");
          navigate({ to: "/dashboard", replace: true });
        } else {
          setSentTo(email.data);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
        if (error) throw error;
        toast.success("Signed in.");
        navigate({ to: destination, replace: true });
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/"><Logo /></Link>
          {sentTo ? (
            <div className="mt-10">
              <MailCheck className="h-10 w-10 text-primary" aria-hidden />
              <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{sentTo}</span>. Open it to activate your account, then sign in.
              </p>
              <Button asChild variant="outline" className="mt-6 w-full"><Link to="/login">Go to sign in</Link></Button>
            </div>
          ) : (
            <>
              <h1 className="mt-10 text-2xl font-semibold">{isSignup ? "Create your account" : "Welcome back"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{isSignup ? "Start reviewing receipts with ReceiptIQ." : "Sign in to your ReceiptIQ workspace."}</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                {isSignup && (
                  <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" name="name" autoComplete="name" maxLength={200} /></div>
                )}
                <div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" autoComplete="email" maxLength={255} /></div>
                <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} maxLength={72} /></div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isSignup ? "Create account" : "Sign in"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isSignup ? "Already have an account? " : "New to ReceiptIQ? "}
                <Link to={isSignup ? "/login" : "/signup"} className="font-medium text-primary hover:underline">{isSignup ? "Sign in" : "Create an account"}</Link>
              </p>
            </>
          )}
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

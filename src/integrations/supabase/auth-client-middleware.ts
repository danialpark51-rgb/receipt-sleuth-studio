import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

/** Forward the signed-in user's Supabase access token to authenticated server functions. */
export const forwardSupabaseAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[receipt-reader] Supabase session lookup failed", { name: error.name });
    throw new Error("Unauthorized: Could not read the current Supabase session.");
  }

  const token = data.session?.access_token;
  if (!token) throw new Error("Unauthorized: No active Supabase session.");

  return next({ headers: { Authorization: `Bearer ${token}` } });
});

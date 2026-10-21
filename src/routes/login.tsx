import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthForm } from "@/components/app/AuthForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => pageHead("Sign in", "Sign in to your ReceiptIQ workspace."),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <AuthForm mode="login" redirectTo={redirect} />;
}

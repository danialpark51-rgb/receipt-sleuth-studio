import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/app/AuthForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Sign in", "Sign in to your ReceiptIQ workspace."),
  component: () => <AuthForm mode="login" />,
});

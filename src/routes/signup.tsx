import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/app/AuthForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/signup")({
  head: () => pageHead("Create account", "Create a ReceiptIQ account for receipt intelligence and expense audits."),
  component: () => <AuthForm mode="signup" />,
});

import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/ui/reset-password-form";

export const metadata: Metadata = { title: "Set a new password — Cobbins AI" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token} />;
}

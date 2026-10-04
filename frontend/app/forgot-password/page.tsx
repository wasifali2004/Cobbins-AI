import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/ui/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password — Cobbins AI" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

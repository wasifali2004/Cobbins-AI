import type { Metadata } from "next";

import ModernLoginSignup from "@/components/ui/modern-login-signup";

export const metadata: Metadata = { title: "Log in — Cobbins AI" };

export default function LoginPage() {
  return <ModernLoginSignup defaultMode="login" />;
}

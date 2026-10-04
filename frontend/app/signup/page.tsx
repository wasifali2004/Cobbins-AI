import type { Metadata } from "next";

import ModernLoginSignup from "@/components/ui/modern-login-signup";

export const metadata: Metadata = { title: "Sign up — Cobbins AI" };

export default function SignupPage() {
  return <ModernLoginSignup defaultMode="signup" />;
}

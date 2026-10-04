import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service — Cobbins AI" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Build responsibly with Cobbins."
      summary="These terms describe the practical rules for using Cobbins to research interfaces, organize references, and generate working UI."
      sections={[
        { heading: "Your account", body: "Keep your account details accurate and your credentials secure. You are responsible for activity performed through your workspace and for the content you submit." },
        { heading: "Acceptable use", body: "Use Cobbins lawfully. Do not attempt to disrupt the service, evade access controls, upload malicious content, or use generated output to infringe the rights of others." },
        { heading: "References and output", body: "You retain rights to your original prompts and content. Product screenshots remain subject to their respective owners’ rights, and generated output should be reviewed before production use." },
        { heading: "Service changes", body: "Features may evolve as Cobbins improves. Material changes to these terms will be communicated through the product or the email associated with your account." },
      ]}
    />
  );
}

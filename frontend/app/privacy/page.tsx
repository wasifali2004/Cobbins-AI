import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy — Cobbins AI" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Your references stay yours."
      summary="This concise policy explains the information Cobbins uses to operate your interface research and generation workspace."
      sections={[
        { heading: "Information we use", body: "We process account details, saved references, prompts, generated interfaces, and basic product analytics needed to provide and improve Cobbins." },
        { heading: "How we use it", body: "Your information is used to authenticate your workspace, return search results, organize collections, generate interfaces, prevent abuse, and support you when something goes wrong." },
        { heading: "Sharing and control", body: "We do not sell personal information. Data is shared only with service providers needed to run Cobbins or when legally required. You can request access, correction, export, or deletion of your account data." },
        { heading: "Questions", body: "For privacy questions or account-data requests, contact privacy@cobbins.ai. We will verify the request before making account-level changes." },
      ]}
    />
  );
}

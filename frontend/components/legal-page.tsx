import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CobbinsLogo } from "@/components/cobbins-logo";
import { ThemeToggle } from "@/components/theme-toggle";

type LegalSection = {
  heading: string;
  body: string;
};

export function LegalPage({
  eyebrow,
  title,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <CobbinsLogo />
        <ThemeToggle />
      </header>
      <article className="legal-card">
        <Link href="/" className="legal-back"><ArrowLeft aria-hidden /> Back to Cobbins</Link>
        <p className="section-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="legal-summary">{summary}</p>
        <div className="legal-copy">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

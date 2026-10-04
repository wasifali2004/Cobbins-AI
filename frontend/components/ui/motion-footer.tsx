"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";

import { CobbinsLogo } from "@/components/cobbins-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { OriginButton } from "@/components/ui/origin-button";
import { Signature } from "@/components/ui/signature";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function MotionFooter() {
  const router = useRouter();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const revealRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!rootRef.current || !panelRef.current || !revealRef.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(revealRef.current, { clipPath: "inset(0% 0% 0% 0%)" });
        return;
      }

      gsap.fromTo(
        revealRef.current,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 92%",
            end: "bottom bottom",
            scrub: 0.7,
          },
        },
      );
      gsap.from(".motion-footer-rise", {
        yPercent: 22,
        opacity: 0,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "25% bottom",
          end: "78% bottom",
          scrub: 0.55,
        },
      });
    },
    { scope: rootRef },
  );

  return (
    <div id="start" className="motion-footer-block">
      <div ref={rootRef} className="motion-footer-root">
        <div ref={revealRef} className="motion-footer-reveal">
          <div ref={panelRef} className="motion-footer" aria-labelledby="closing-heading">
            <div className="motion-footer-marquee" aria-hidden>
              <div>
                <span>SEARCH REAL SCREENS</span><i>✦</i><span>ORGANIZE REFERENCES</span><i>✦</i><span>GENERATE REACT</span><i>✦</i>
                <span>SEARCH REAL SCREENS</span><i>✦</i><span>ORGANIZE REFERENCES</span><i>✦</i><span>GENERATE REACT</span><i>✦</i>
              </div>
            </div>

            <div className="content-width motion-footer-content">
              <div className="motion-footer-top motion-footer-rise">
                <p className="section-kicker">The next screen / starts here</p>
                <ThemeToggle />
              </div>
              <div className="motion-footer-cta motion-footer-rise">
                <h2 id="closing-heading">Build with a better point of reference.</h2>
                <p>
                  Search the archive, collect the visual evidence, and turn it into
                  a working interface while the idea still has momentum.
                </p>
                <div>
                  <OriginButton size="lg" onClick={() => router.push("/signup")}>Create now <ArrowUpRight aria-hidden /></OriginButton>
                  <OriginButton size="lg" variant="outline" onClick={() => router.push("/dashboard")}>Explore gallery <ArrowUpRight aria-hidden /></OriginButton>
                </div>
              </div>
              <div className="motion-footer-word" aria-hidden>COBBINS</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="cobbins-site-footer">
        <div className="content-width cobbins-footer-grid">
          <div className="cobbins-footer-brand">
            <CobbinsLogo />
            <p>A searchable interface archive and AI workspace for teams that want evidence behind every screen.</p>
            <Signature
              text="Wasif Ali"
              fontSize={48}
              duration={1.5}
              inView
              fontUrl="/LastoriaBoldRegular.otf"
              className="cobbins-footer-signature"
            />
          </div>
          <nav aria-label="Explore Cobbins">
            <strong>Explore</strong>
            <a href="#gallery">Generated screens</a>
            <a href="#workflow">How it works</a>
            <Link href="/dashboard">Workspace</Link>
          </nav>
          <nav aria-label="Cobbins information">
            <strong>Company</strong>
            <a href="#faq">FAQ</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
          <div className="cobbins-footer-contact">
            <strong>Have a question?</strong>
            <a href="mailto:support@cobbins.ai">support@cobbins.ai <ArrowUpRight aria-hidden /></a>
          </div>
        </div>
        <div className="content-width cobbins-footer-bottom">
          <span>© 2026 Cobbins AI</span>
          <span>Interfaces worth learning from.</span>
        </div>
      </footer>
    </div>
  );
}

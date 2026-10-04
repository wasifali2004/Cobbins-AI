"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";

import { CobbinsLogo } from "@/components/cobbins-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { GridPattern } from "@/components/ui/grid-pattern";
import { OriginButton } from "@/components/ui/origin-button";
import { TextMorph } from "@/components/ui/text-morph";

export default function HeroSection() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    function onClickOutside(event: MouseEvent) {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener("keydown", onKey);
      document.addEventListener("click", onClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClickOutside);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function scrollTo(selector: string) {
    setMenuOpen(false);
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="top" className="imported-hero w-full bg-no-repeat bg-cover bg-center text-sm">
      <GridPattern
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 2],
          [12, 4],
        ]}
        className="[mask-image:radial-gradient(600px_circle_at_center,white,transparent)] inset-x-0 inset-y-[-20%] h-[140%] -z-10 dark:fill-white/10 dark:stroke-white/10"
      />
      <nav className="flex items-center justify-between p-4 md:px-16 lg:px-24 xl:px-32 md:py-6 w-full" aria-label="Primary navigation">
        <CobbinsLogo className="navbar-brand" />

        <div
          id="menu"
          ref={menuRef}
          className={[
            "imported-hero-menu max-md:absolute max-md:top-0 max-md:left-0 max-md:transition-all max-md:duration-300 max-md:overflow-hidden max-md:h-full max-md:backdrop-blur",
            "flex items-center gap-8 font-medium max-md:flex-col max-md:justify-center",
            menuOpen ? "max-md:w-full" : "max-md:w-0",
          ].join(" ")}
          aria-hidden={!menuOpen}
        >
          <button type="button" onClick={() => scrollTo("#top")} className="imported-hero-nav-link">Home</button>

          <div className="relative group flex items-center gap-1 cursor-pointer">
            <span>Library</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="imported-hero-dropdown absolute font-normal flex flex-col gap-2 w-max rounded-lg p-4 top-36 left-0 opacity-0 -translate-y-full group-hover:top-44 group-hover:opacity-100 transition-all duration-300 shadow-sm">
              <button type="button" onClick={() => scrollTo("#gallery")}>Screen archive</button>
              <button type="button" onClick={() => scrollTo("#workflow")}>Visual search</button>
              <button type="button" onClick={() => router.push("/dashboard?view=generate")}>AI generator</button>
              <button type="button" onClick={() => router.push("/dashboard?view=library")}>React exports</button>
            </div>
          </div>

          <button type="button" onClick={() => scrollTo("#testimonials")} className="imported-hero-nav-link">Field notes</button>
          <button type="button" onClick={() => scrollTo("#faq")} className="imported-hero-nav-link">FAQ</button>

          <button
            onClick={() => setMenuOpen(false)}
            className="imported-hero-icon-button md:hidden"
            aria-label="Close menu"
            type="button"
          >
            <X aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <OriginButton className="hidden md:inline-flex imported-hero-pill" onClick={() => router.push("/dashboard")}>
            Open workspace
          </OriginButton>
          <button
            id="open-menu"
            onClick={() => setMenuOpen(true)}
            className="imported-hero-icon-button md:hidden"
            aria-label="Open menu"
            type="button"
          >
            <Menu aria-hidden />
          </button>
        </div>
      </nav>

      <div className="imported-hero-content">
        {/*
          Creative stacked heading:
          Line 1 — "Design smarter,"
          Line 2 — "build faster with" + animated morph word
          The TextMorph is inline on the last line, baseline-aligned.
        */}
        <h1 className="hero-heading-stacked">
          <span className="hero-heading-line1">Design smarter,</span>
          <span className="hero-heading-line2">
            <span className="hero-heading-prefix">build faster with</span>
            <TextMorph
              words={["references.", "evidence.", "context.", "Cobbins."]}
              interval={2400}
              morphDuration={680}
              className="hero-morph-word"
            />
          </span>
        </h1>

        <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2">
          Search proven web-app interfaces, collect the patterns worth keeping,
          and generate editable React grounded in your references.
        </p>

        <div className="mx-auto w-full flex items-center justify-center gap-3 mt-5 max-sm:flex-col max-sm:px-5">
          <OriginButton className="imported-hero-pill max-sm:w-full" onClick={() => router.push("/signup")}>
            Start exploring
          </OriginButton>
          <OriginButton variant="outline" className="imported-hero-pill max-sm:w-full" onClick={() => scrollTo("#gallery")}>
            <span>Browse generated screens</span>
            <ArrowRight size={15} aria-hidden />
          </OriginButton>
        </div>
      </div>
    </section>
  );
}

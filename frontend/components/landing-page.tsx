"use client";

import HeroSection from "@/components/hero";
import { BottomNavBar } from "@/components/navbar";
import { FaqSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ToolsOrbit } from "@/components/landing/tools-orbit";
import { WorldMap } from "@/components/landing/world-map";
import { ZoomGallerySection } from "@/components/landing/zoom-gallery-section";
import { Compare2 } from "@/components/ui/compare-2";
import { MotionFooter } from "@/components/ui/motion-footer";
import { ThreeDTestimonials } from "@/components/ui/three-d-testimonials";

export function LandingPage() {
  return (
    <main className="page-shell">
      <HeroSection />
      <FeaturesSection />
      <ToolsOrbit />
      <ZoomGallerySection />
      <Compare2 />
      <WorldMap />
      <ThreeDTestimonials />
      <FaqSection />
      <MotionFooter />
      <BottomNavBar stickyBottom className="landing-bottom-nav" />
    </main>
  );
}

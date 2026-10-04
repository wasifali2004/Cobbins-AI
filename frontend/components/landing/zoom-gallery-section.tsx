"use client";

import { ZoomParallax } from "@/components/ui/zoom-parallax";

const PROJECT_IMAGES = [
  { src: "/gallery/revenue-pulse.jpg", alt: "Revenue pulse dashboard interface" },
  { src: "/gallery/calm-checkout.jpg", alt: "Calm checkout commerce interface" },
  { src: "/gallery/oceanic-inbox.jpg", alt: "Oceanic inbox messaging interface" },
  { src: "/gallery/signal-console.jpg", alt: "Signal console analytics interface" },
  { src: "/gallery/journey-planner.jpg", alt: "Journey planner travel interface" },
];

export function ZoomGallerySection() {
  return (
    <section id="gallery" className="zoom-gallery-section" aria-labelledby="gallery-heading">
      <div className="zoom-gallery-intro">
        <span className="section-kicker">Cobbins / generated archive</span>
        <h2 id="gallery-heading" className="gallery-bento-title">Interface studies</h2>
        <p>Scroll to zoom through interfaces generated in the Cobbins workspace.</p>
      </div>
      <ZoomParallax images={PROJECT_IMAGES} />
    </section>
  );
}

"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Testimonial = {
  quote: string;
  initials: string;
  name: string;
  role: string;
  city: string;
  image: string;
};

const testimonials: Testimonial[] = [
  { quote: "Visual search finally lets me find the checkout I remember without knowing which product shipped it.", initials: "AM", name: "Ana Martins", role: "Product designer", city: "Lisbon", image: "/testimonials/ana-martins.jpg" },
  { quote: "Cobbins gives every critique a shared reference. We spend less time explaining and more time deciding.", initials: "NO", name: "Nia Okafor", role: "Design lead", city: "Nairobi", image: "/testimonials/nia-okafor.jpg" },
  { quote: "We assembled a credible onboarding flow before our first planning session had even ended.", initials: "RK", name: "Ravi Khanna", role: "Founder", city: "New Delhi", image: "/testimonials/ravi-khanna.jpg" },
  { quote: "The generated React starts from real interface logic, so it feels much closer to something we would ship.", initials: "JL", name: "Jules Laurent", role: "Frontend lead", city: "Paris", image: "/testimonials/jules-laurent.jpg" },
  { quote: "Collections replaced a maze of screenshots and links. Our whole research trail now has a home.", initials: "MK", name: "Maya Kim", role: "UX researcher", city: "Seoul", image: "/testimonials/maya-kim.jpg" },
  { quote: "It is the fastest way I have found to compare how serious products solve the same workflow.", initials: "TO", name: "Theo Owens", role: "Product manager", city: "London", image: "/testimonials/theo-owens.jpg" },
  { quote: "I can move from an interesting reference to an editable interface while the idea is still fresh.", initials: "SV", name: "Sofia Vega", role: "Independent designer", city: "Mexico City", image: "/testimonials/sofia-vega.jpg" },
  { quote: "The archive feels considered. Every screen is useful context, not another noisy inspiration feed.", initials: "EB", name: "Eli Brooks", role: "Creative director", city: "New York", image: "/testimonials/eli-brooks.jpg" },
  { quote: "Cobbins made our design handoff concrete: the references, decisions, and first build live together.", initials: "HF", name: "Hana Fujii", role: "Design engineer", city: "Tokyo", image: "/testimonials/hana-fujii.jpg" },
  { quote: "It gives a small team the research depth of a much larger design organization.", initials: "CP", name: "Camila Pereira", role: "Co-founder", city: "Sao Paulo", image: "/testimonials/camila-pereira.jpg" },
  { quote: "Instead of asking AI to invent a dashboard, we show it the interaction grammar we actually want.", initials: "DW", name: "Daniel Wu", role: "Staff engineer", city: "Vancouver", image: "/testimonials/daniel-wu.jpg" },
  { quote: "Our reference boards are now living product briefs instead of folders nobody opens twice.", initials: "ZA", name: "Zuri Adams", role: "Product strategist", city: "Cape Town", image: "/testimonials/zuri-adams.jpg" },
];

function Marquee({
  children,
  reverse = false,
  reduced = false,
  className,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  reduced?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("testimonial-marquee", className)} data-reduced={reduced || undefined}>
      {[0, 1].map((copy) => (
        <div
          className="testimonial-marquee-track"
          data-reverse={reverse || undefined}
          aria-hidden={copy === 1}
          key={copy}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="three-d-testimonial-card">
      <span className="testimonial-index" aria-hidden>COBBINS / VERIFIED</span>
      <blockquote>“{testimonial.quote}”</blockquote>
      <footer>
        <Avatar>
          <AvatarImage src={testimonial.image} alt={`Portrait of ${testimonial.name}`} />
          <AvatarFallback delayMs={500}>{testimonial.initials}</AvatarFallback>
        </Avatar>
        <span>
          <strong>{testimonial.name}</strong>
          <small>{testimonial.role} · {testimonial.city}</small>
        </span>
      </footer>
    </article>
  );
}

export function ThreeDTestimonials() {
  const reduceMotion = useReducedMotion();
  const columns = [0, 1, 2, 3, 4].map((column) =>
    Array.from({ length: 5 }, (_, row) => testimonials[(column + row * 5) % testimonials.length]),
  );

  return (
    <section id="testimonials" className="section three-d-testimonials" aria-labelledby="testimonials-heading">
      <motion.div
        className="content-width testimonials-heading"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: .55 }}
        transition={{ duration: .65 }}
      >
        <p className="section-kicker">Testimonials / field notes</p>
        <h2 id="testimonials-heading" className="section-heading">What product teams say after building from evidence.</h2>
        <p className="section-copy">A continuously moving wall of notes from designers, founders, and engineers using Cobbins in real product work.</p>
      </motion.div>
      <div className="three-d-testimonials-full">
        <motion.div
          className="three-d-stage three-d-stage-full"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85 }}
        >
          <div className="three-d-plane three-d-plane-full">
            {columns.map((column, columnIndex) => (
              <Marquee key={columnIndex} reverse={columnIndex % 2 === 1} reduced={Boolean(reduceMotion)}>
                {column.map((testimonial) => (
                  <TestimonialCard testimonial={testimonial} key={testimonial.name} />
                ))}
              </Marquee>
            ))}
          </div>
          <div className="three-d-stage-shade" aria-hidden />
        </motion.div>
      </div>
    </section>
  );
}

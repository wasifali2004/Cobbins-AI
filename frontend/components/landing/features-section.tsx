"use client";

import type { ReactNode } from "react";
import { Code2, Layers, Palette, Search, Sparkles, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { FeatureCard } from "@/components/ui/grid-feature-cards";

const features = [
  {
    title: "Visual search",
    icon: Search,
    description: "Search real product screens instead of starting from a blank prompt.",
  },
  {
    title: "Grounded generation",
    icon: Sparkles,
    description: "Every section is matched against a real component library before it's written.",
  },
  {
    title: "Component library",
    icon: Layers,
    description: "Build a personal reference library that improves every generation after it.",
  },
  {
    title: "Clean exports",
    icon: Code2,
    description: "Editable React and Tailwind, no lock-in, no watermark, yours to keep.",
  },
  {
    title: "Theme aware",
    icon: Palette,
    description: "Pages adapt to a cohesive palette and font pulled from your prompt or reference.",
  },
  {
    title: "Fast iteration",
    icon: Zap,
    description: "Live preview and instant regeneration as your idea takes shape.",
  },
];

type ViewAnimationProps = {
  delay?: number;
  className?: string;
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-32" aria-labelledby="features-heading">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <h2 id="features-heading" className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl xl:font-extrabold">
            Search. Generate. Own the code.
          </h2>
          <p className="text-muted-foreground mt-4 text-sm tracking-wide text-balance md:text-base">
            Everything Cobbins needs to turn a reference into a real interface.
          </p>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed sm:grid-cols-2 md:grid-cols-3"
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}

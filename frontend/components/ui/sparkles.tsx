"use client";

import { useId, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

import { cn } from "@/lib/utils";

type SparklesCoreProps = {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

async function initializeParticles(engine: Engine) {
  await loadSlim(engine);
}

export function SparklesCore({
  id,
  className,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  speed = 1,
  particleColor = "#ffffff",
  particleDensity = 120,
}: SparklesCoreProps) {
  const controls = useAnimation();
  const generatedId = useId();

  const options = useMemo<ISourceOptions>(() => ({
    background: { color: { value: background } },
    detectRetina: true,
    fpsLimit: 60,
    fullScreen: { enable: false, zIndex: 1 },
    interactivity: {
      events: {
        onClick: { enable: false, mode: "push" },
        onHover: { enable: false, mode: "repulse" },
      },
    },
    particles: {
      paint: { fill: { enable: true, color: { value: particleColor } } },
      links: { enable: false },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "out" },
        random: false,
        speed: { min: 0.1, max: 0.6 },
        straight: false,
      },
      number: {
        density: { enable: true, height: 400, width: 400 },
        value: particleDensity,
      },
      opacity: {
        animation: {
          enable: true,
          speed,
          startValue: "random",
          sync: false,
        },
        value: { min: 0.1, max: 0.9 },
      },
      shape: { type: "circle" },
      size: { value: { min: minSize, max: maxSize } },
    },
  }), [background, maxSize, minSize, particleColor, particleDensity, speed]);

  async function handleParticlesLoaded(container?: Container) {
    if (!container) return;
    await controls.start({ opacity: 1, transition: { duration: 0.8 } });
  }

  return (
    <ParticlesProvider init={initializeParticles}>
      <motion.div animate={controls} className={cn("opacity-0", className)}>
        <Particles
          className="h-full w-full"
          id={id ?? generatedId}
          options={options}
          particlesLoaded={handleParticlesLoaded}
        />
      </motion.div>
    </ParticlesProvider>
  );
}

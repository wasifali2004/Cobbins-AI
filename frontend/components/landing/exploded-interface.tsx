"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Bookmark, Search, Sparkles } from "lucide-react";

import { ScreenVisual } from "@/components/screen-visual";

export function ExplodedInterface() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(pointerY, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);

  return (
    <motion.div
      className="exploded-interface"
      style={reduceMotion ? undefined : { rotateX, rotateY }}
      onPointerMove={(event) => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
        pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Cobbins visual research workspace preview"
    >
      <div className="interface-orbit-line interface-orbit-one" aria-hidden />
      <div className="interface-orbit-line interface-orbit-two" aria-hidden />

      <div className="interface-fragment interface-fragment-search">
        <Search aria-hidden />
        <span>Search billing dashboards…</span>
        <kbd>⌘K</kbd>
      </div>
      <div className="interface-fragment interface-fragment-tag">
        <Sparkles aria-hidden /> <span>Visual match · 94%</span>
      </div>
      <div className="interface-fragment interface-fragment-save">
        <Bookmark aria-hidden /> <span>Saved to SaaS patterns</span>
      </div>

      <div className="interface-main-card">
        <div className="interface-card-top">
          <span><i /> cobbins / workspace</span>
          <b>Generated</b>
        </div>
        <ScreenVisual variant="analytics" />
        <div className="interface-card-bottom">
          <span>Analytics / Overview</span>
          <small>08 source screens</small>
        </div>
      </div>

      <div className="interface-reference interface-reference-one"><ScreenVisual variant="billing" /></div>
      <div className="interface-reference interface-reference-two"><ScreenVisual variant="settings" /></div>
      <span className="interface-coordinate coordinate-one">X / 0234</span>
      <span className="interface-coordinate coordinate-two">REF / 008</span>
    </motion.div>
  );
}

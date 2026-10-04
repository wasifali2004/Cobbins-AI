"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  Boxes,
  Braces,
  Code2,
  Database,
  Figma,
  Layers3,
  Orbit,
  Palette,
  ScanSearch,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import HowItWorks, { type Step } from "@/components/ui/how-it-works";

type OrbitRing = "outer" | "inner";

const tools: Array<{
  label: string;
  ring: OrbitRing;
  x: number;
  y: number;
  size: string;
  color: string;
  icon: ReactNode;
}> = [
  { label: "Figma", ring: "outer", x: 10, y: 61, size: "76px", color: "#f24e1e", icon: <Figma /> },
  { label: "React primitives", ring: "outer", x: 20, y: 35, size: "86px", color: "#55c8eb", icon: <Boxes /> },
  { label: "Visual search", ring: "outer", x: 36, y: 20, size: "70px", color: "#7188ff", icon: <ScanSearch /> },
  { label: "AI generation", ring: "outer", x: 52, y: 13, size: "96px", color: "#9077ee", icon: <WandSparkles /> },
  { label: "Tailwind", ring: "outer", x: 68, y: 23, size: "74px", color: "#38bdf8", icon: <span className="tool-letter">TW</span> },
  { label: "TypeScript", ring: "outer", x: 82, y: 39, size: "84px", color: "#3178c6", icon: <Braces /> },
  { label: "Data sources", ring: "outer", x: 91, y: 64, size: "72px", color: "#22b866", icon: <Database /> },
  { label: "Clean code", ring: "inner", x: 66, y: 59, size: "62px", color: "#f59e0b", icon: <Code2 /> },
  { label: "Component systems", ring: "inner", x: 34, y: 59, size: "64px", color: "#e84d98", icon: <Layers3 /> },
  { label: "Interaction flows", ring: "inner", x: 43, y: 46, size: "60px", color: "#7c6cf2", icon: <Workflow /> },
  { label: "Design tokens", ring: "inner", x: 57, y: 46, size: "58px", color: "#d65a86", icon: <Palette /> },
  { label: "Similarity engine", ring: "inner", x: 50, y: 61, size: "66px", color: "#5e73e7", icon: <Orbit /> },
];

const workflowSteps: Step[] = [
  {
    title: "Find the right pattern",
    description: "Search thousands of real product screens by flow, element, product, or visual similarity.",
    colorTheme: "orange",
  },
  {
    title: "Curate your evidence",
    description: "Save the strongest screens into focused reference sets the AI can understand and trust.",
    colorTheme: "blue",
  },
  {
    title: "Generate working UI",
    description: "Describe the outcome and turn your references into accessible React and production-minded HTML.",
    colorTheme: "purple",
  },
];

export function ToolsOrbit() {
  const reduceMotion = useReducedMotion();
  const outerTools = tools.filter((tool) => tool.ring === "outer");
  const innerTools = tools.filter((tool) => tool.ring === "inner");

  return (
    <section id="workflow" className="section tools-section" aria-labelledby="tools-heading">
      <div className="content-width">
        <motion.div
          className="tools-heading"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.66 }}
        >
          <p className="section-kicker">From reference to reality</p>
          <h2 id="tools-heading" className="section-heading">
            Prompt in, interface out, with your tools in the loop.
          </h2>
          <p className="section-copy">
            Cobbins connects visual research and AI generation, so the code you
            create starts with evidence instead of guesswork.
          </p>
        </motion.div>

        <div className="orbit-stage" data-reduced={reduceMotion || undefined}>
          <svg className="orbit-lines" viewBox="0 0 1000 580" preserveAspectRatio="none" aria-hidden>
            <ellipse className="orbit-line orbit-ring-static" cx="500" cy="290" rx="430" ry="235" />
            <ellipse className="orbit-line orbit-ring-static" cx="500" cy="290" rx="285" ry="145" />
          </svg>

          {[...outerTools, ...innerTools].map((tool, index) => {
            const ringTools = tool.ring === "outer" ? outerTools : innerTools;
            const ringIndex = ringTools.findIndex((candidate) => candidate.label === tool.label);
            const duration = tool.ring === "outer" ? 58 : 42;
            return (
              <div
                className="orbit-node"
                data-ring={tool.ring}
                key={tool.label}
                style={{
                  "--x": `${tool.x}%`,
                  "--y": `${tool.y}%`,
                  "--size": tool.size,
                  "--orbit-duration": `${duration}s`,
                  "--orbit-delay": `${-(duration / ringTools.length) * ringIndex}s`,
                  "--node-order": index,
                } as CSSProperties}
              >
                <div
                  className="tool-badge"
                  style={{ color: tool.color } as CSSProperties}
                  title={tool.label}
                  aria-label={tool.label}
                >
                  {tool.icon}
                </div>
              </div>
            );
          })}

          <motion.div
            className="hub-node"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : .78 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: .5 }}
            transition={{ delay: reduceMotion ? 0 : .28, duration: .5 }}
          >
            <Image src="/white-logo.png" alt="Cobbins AI hub" width={72} height={72} className="logo-for-light logo-inverted-light" />
            <Image src="/white-logo.png" alt="Cobbins AI hub" width={72} height={72} className="logo-for-dark" />
          </motion.div>
        </div>
      </div>
      <HowItWorks features={workflowSteps} className="cobbins-how-it-works" />
    </section>
  );
}

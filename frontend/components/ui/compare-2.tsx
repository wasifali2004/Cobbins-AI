"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function FadeIn({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 10 }}
      whileInView={{ opacity: 1, translateY: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const Compare2 = () => {
  return (
    <section id="comparison" className="compare-2-section py-20" aria-labelledby="comparison-heading">
      <div>
        <div className="mt-6 grid w-full lg:grid-cols-2">
          <div className="mx-auto max-w-2xl space-y-8 px-6 py-14">
            <FadeIn>
              <h2 id="comparison-heading" className="w-full text-center text-4xl tracking-tighter">
                Choose Cobbins for
              </h2>
            </FadeIn>
            <div className="space-y-9">
              <FadeIn delay={0.05}>
                <div className="flex flex-col space-y-5">
                  <h2 className="w-full text-lg font-medium tracking-tighter">
                    Grounded, reference-led generation
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                      <p className="text-md">
                        Generation grounded in a real component library, not a blank guess
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                      <p className="text-md">
                        A visual search step you can inspect before code is written
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                      <p className="text-md">Clean, editable React and Tailwind you actually own</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="flex flex-col space-y-5">
                  <h2 className="w-full text-lg font-medium tracking-tighter">
                    Built for real product work
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                      <p className="text-md">
                        A personal screen library that grows with every project
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.15}>
                <div className="flex flex-col space-y-5">
                  <h2 className="w-full text-lg font-medium tracking-tighter">
                    No lock-in
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                      <p className="text-md">Export the full source at any time, no watermark</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                      <p className="text-md">
                        Works with the tools you already use, from Figma references to React output
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="flex flex-col space-y-5">
                  <h2 className="w-full text-lg font-medium tracking-tighter">
                    Fast iteration
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                      <p className="text-md">
                        Live preview and instant regeneration as your prompt evolves
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
          <div className="bg-secondary">
            <div className="mx-auto max-w-2xl space-y-8 px-6 py-14">
              <FadeIn>
                <h2 className="w-full text-center text-4xl tracking-tighter">
                  Generic AI builders
                </h2>
              </FadeIn>
              <div className="space-y-9">
                <FadeIn delay={0.05}>
                  <div className="flex flex-col space-y-5">
                    <h2 className="w-full text-lg font-medium tracking-tighter">
                      One-shot, ungrounded output
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                        <p className="text-md">Generic layouts pulled from a generic average</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                        <p className="text-md">
                          No visibility into what pattern the output was based on
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                        <p className="text-md">
                          Fine for a rough first draft, harder to steer precisely
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <div className="flex flex-col space-y-5">
                    <h2 className="w-full text-lg font-medium tracking-tighter">
                      Platform lock-in
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                        <p className="text-md">
                          Often tied to hosting on their own platform
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                        <p className="text-md">
                          Exported code can be harder to hand off to a real codebase
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Check className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-1" />
                        <p className="text-md">No persistent, personal reference library</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Compare2 };

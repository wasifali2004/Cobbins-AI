"use client";

import { motion } from "framer-motion";

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HeroFinancial() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-[#f7f9fc] px-4 pt-20 pb-16 text-[#1e293b]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50 via-blue-100/60 to-transparent" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <Reveal>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-white bg-white px-1.5 py-1 shadow-lg shadow-blue-500/20">
            <span className="rounded-full bg-gradient-to-br from-blue-500 to-blue-300 px-2 py-0.5 text-xs font-medium uppercase tracking-widest text-white">
              New
            </span>
            <span className="text-sm font-medium">Announcing our latest product launch</span>
          </span>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="max-w-4xl text-5xl font-medium tracking-tight text-neutral-900 sm:text-6xl md:text-7xl">
            Make your financial <br /> operations seamless.
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="max-w-2xl text-lg font-medium leading-relaxed text-neutral-500 md:text-xl">
            The next-generation finance software built to simplify, automate, and elevate your financial operations.
          </p>
        </Reveal>

        <Reveal delay={0.24} className="flex gap-4">
          <button className="rounded-lg border border-blue-300 bg-gradient-to-br from-blue-500 via-blue-400 to-blue-200 px-4 py-2.5 text-lg text-white shadow-sm transition hover:opacity-90">
            Get started
          </button>
          <button className="rounded-lg border border-neutral-300 bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-300 px-4 py-2.5 text-lg text-black shadow-sm transition hover:opacity-90">
            Learn more
          </button>
        </Reveal>
      </div>

      <Reveal delay={0.32} className="relative z-10 mt-12 w-full max-w-6xl">
        <div className="rounded-2xl border border-white/60 bg-white/50 p-4 backdrop-blur-lg">
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-white to-blue-50">
            <div className="grid w-2/3 grid-cols-3 gap-4">
              <div className="col-span-2 h-24 rounded-lg bg-white shadow-sm" />
              <div className="h-24 rounded-lg bg-white shadow-sm" />
              <div className="h-16 rounded-lg bg-white shadow-sm" />
              <div className="h-16 rounded-lg bg-white shadow-sm" />
              <div className="h-16 rounded-lg bg-white shadow-sm" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default HeroFinancial;

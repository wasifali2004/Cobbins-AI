"use client";

import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Products", href: "#" },
  { label: "Solutions", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Docs", href: "#" },
  { label: "Blog", href: "#" },
];

export function CenteredNavHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative flex h-16 w-full items-center border-b border-border bg-background px-6 text-foreground">
      <a href="#" className="flex shrink-0 items-center gap-2.5">
        <div className="grid grid-cols-2 gap-0.5" aria-hidden="true">
          <div className="size-2.5 bg-primary" />
          <div className="size-2.5 bg-primary" />
          <div className="size-2.5 bg-primary" />
          <div className="size-2.5 bg-primary" />
        </div>
        <span className="text-base font-bold tracking-tight">Acme</span>
      </a>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <a href="#" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
          Sign In
        </a>
        <div className="hidden h-5 w-px bg-border sm:block" />
        <a
          href="#"
          className="hidden items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
        >
          Start Free Trial
          <ArrowRight className="size-4" aria-hidden />
        </a>

        <button
          onClick={() => setOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border md:hidden"
          aria-label="Open menu"
          type="button"
        >
          <Menu className="size-4" aria-hidden />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-background p-6 shadow-lg"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-lg font-semibold">
                  <div className="grid grid-cols-2 gap-0.5" aria-hidden="true">
                    <div className="size-2 bg-primary" />
                    <div className="size-2 bg-primary" />
                    <div className="size-2 bg-primary" />
                    <div className="size-2 bg-primary" />
                  </div>
                  Acme
                </span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" type="button">
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <nav className="mt-6 flex flex-col">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2">
                <a href="#" className="w-full rounded-md py-2.5 text-center text-sm font-medium text-muted-foreground">
                  Sign In
                </a>
                <a href="#" className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
                  Start Free Trial
                  <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

export default CenteredNavHeader;

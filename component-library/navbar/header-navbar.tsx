"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { href: "#pricing", label: "Pricing" },
  { href: "#company", label: "Company" },
  { href: "#blog", label: "Blog" },
  { href: "#login", label: "Login" },
];

export function Navbar({ banner }: { banner?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="pt-8 sm:pt-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative flex items-center justify-between border-t border-b border-border py-3">
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-2 py-1" title="Home">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">A</span>
              <span className="text-sm font-semibold tracking-tight text-foreground">Acme</span>
            </a>
            {banner && <div className="hidden items-center py-1 lg:flex">{banner}</div>}
          </div>

          <nav className="relative hidden lg:flex">
            {links.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="flex items-center px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent/50"
              >
                {label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setOpen((v) => !v)}
            className="flex size-12 items-center justify-center self-center rounded-lg text-foreground transition-colors hover:bg-accent lg:hidden"
            aria-label={open ? "Close main menu" : "Open main menu"}
            type="button"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden">
          <div className="flex flex-col gap-6 border-t border-border px-6 py-4">
            {links.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.05 }}
              >
                <a href={link.href} className="text-base font-medium text-foreground">
                  {link.label}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

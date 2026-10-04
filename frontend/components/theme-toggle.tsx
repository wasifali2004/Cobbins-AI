"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className={cn("theme-toggle", className)}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      <motion.span
        key={theme}
        initial={{ rotate: -35, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
      </motion.span>
    </button>
  );
}

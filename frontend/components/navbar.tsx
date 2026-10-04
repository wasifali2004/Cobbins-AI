"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { motion } from "framer-motion";
import {
  Home,
  LineChart,
  CreditCard,
  MessageCircle,
  Scale,
  Trophy,
} from "lucide-react";

import { LoginIcon } from "@/components/icons/login-icon";
import { cn } from "@/lib/utils";

function buildNavItems(isSignedIn: boolean) {
  return [
    { id: "home", label: "Home", icon: Home, target: "#top" },
    { id: "library", label: "Library", icon: LineChart, target: "#gallery" },
    { id: "compare", label: "Compare", icon: Scale, target: "#comparison" },
    { id: "field-notes", label: "Field notes", icon: MessageCircle, target: "#testimonials" },
    { id: "faq", label: "FAQ", icon: Trophy, target: "#faq" },
    { id: "primary-cta", label: isSignedIn ? "Generate" : "Sign up", icon: isSignedIn ? CreditCard : LoginIcon, target: isSignedIn ? "/dashboard?view=generate" : "/signup" },
  ];
}

const MOBILE_LABEL_WIDTH = 72;

type BottomNavBarProps = {
  className?: string;
  defaultIndex?: number;
  stickyBottom?: boolean;
};

export function BottomNavBar({
  className,
  defaultIndex = 0,
  stickyBottom = false,
}: BottomNavBarProps) {
  const router = useRouter();
  const { status } = useSession();
  const navItems = buildNavItems(status === "authenticated");
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("#top");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting),
      { threshold: 0.04 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.nav
      initial={false}
      animate={{
        y: isVisible ? 0 : 82,
        scale: isVisible ? 1 : 0.94,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      aria-hidden={!isVisible}
      data-visible={isVisible || undefined}
      className={cn(
        "bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded-full flex items-center p-2 shadow-xl space-x-1 min-w-[320px] max-w-[95vw] h-[52px]",
        stickyBottom && "fixed inset-x-0 bottom-4 mx-auto z-20 w-fit",
        className,
      )}
    >
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeIndex === idx;

        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[40px] max-h-[44px]",
              isActive
                ? "bg-[var(--text)] text-[var(--bg)] gap-2"
                : "bg-transparent text-[var(--muted)] hover:bg-[var(--bg-subtle)]",
              "focus:outline-none focus-visible:ring-0",
            )}
            onClick={() => {
              setActiveIndex(idx);
              if (item.target.startsWith("/")) {
                router.push(item.target);
              } else {
                document.querySelector(item.target)?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            aria-label={item.label}
            type="button"
          >
            <Icon
              size={22}
              strokeWidth={2}
              aria-hidden
              className="transition-colors duration-200"
            />

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "8px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.19 },
                marginLeft: { duration: 0.19 },
              }}
              className={cn("overflow-hidden flex items-center max-w-[72px]")}
            >
              <span
                className={cn(
                  "font-medium text-xs whitespace-nowrap select-none transition-opacity duration-200 overflow-hidden text-ellipsis text-[clamp(0.625rem,0.5263rem+0.5263vw,1rem)] leading-[1.9]",
                  isActive ? "text-[var(--bg)]" : "opacity-0",
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;

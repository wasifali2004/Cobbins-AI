"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface UniqueLoadingProps {
  variant?: "morph";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: { container: 64, square: 14, offset: 12 },
  md: { container: 96, square: 18, offset: 16 },
  lg: { container: 160, square: 26, offset: 24 },
  xl: { container: 220, square: 34, offset: 32 },
};

export default function UniqueLoading({
  variant = "morph",
  size = "md",
  className,
}: UniqueLoadingProps) {
  const { container, square, offset } = SIZES[size];

  if (variant === "morph") {
    return (
      <div
        className={cn("relative", className)}
        style={{ width: container, height: container }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute bg-black dark:bg-white"
              style={{
                width: square,
                height: square,
                "--morph-offset": `${offset}px`,
                animation: `morph-${i} 2s infinite ease-in-out`,
                animationDelay: `${i * 0.2}s`,
              } as CSSProperties}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

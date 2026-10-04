"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

const FILL_DURATION = 0.5;
const FILL_EASE = [0.16, 1, 0.3, 1] as const;

type ButtonHTMLAttributesForMotion = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDragStart"
  | "onDrop"
>;

function getCoverDiameter(width: number, height: number, x: number, y: number) {
  return Math.ceil(
    2 * Math.max(
      Math.hypot(x, y),
      Math.hypot(width - x, y),
      Math.hypot(x, height - y),
      Math.hypot(width - x, height - y),
    ),
  );
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

type OriginButtonProps = ButtonHTMLAttributesForMotion & {
  loading?: boolean;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
};

const OriginButton = React.forwardRef<HTMLButtonElement, OriginButtonProps>(
  (
    {
      children,
      className,
      disabled = false,
      loading = false,
      variant = "primary",
      size = "default",
      type = "button",
      onBlur,
      onClick,
      onFocus,
      onKeyDown,
      onKeyUp,
      onPointerCancel,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onPointerUp,
      ...props
    },
    ref,
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const isDisabled = Boolean(disabled || loading);
    const [hovered, setHovered] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);
    const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
    const [coverSize, setCoverSize] = React.useState(0);
    const showFill = !isDisabled && (hovered || pressed);

    const updateOrigin = React.useCallback((x: number, y: number) => {
      const node = buttonRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setOrigin({ x, y });
      setCoverSize(getCoverDiameter(rect.width, rect.height, x, y));
    }, []);

    const updateFromPointer = React.useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      updateOrigin(event.clientX - rect.left, event.clientY - rect.top);
    }, [updateOrigin]);

    const updateFromCenter = React.useCallback(() => {
      const node = buttonRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      updateOrigin(rect.width / 2, rect.height / 2);
    }, [updateOrigin]);

    React.useLayoutEffect(() => {
      const node = buttonRef.current;
      if (!node || !showFill) return;

      const measure = () => {
        const rect = node.getBoundingClientRect();
        setCoverSize(getCoverDiameter(rect.width, rect.height, origin.x, origin.y));
      };
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      measure();
      return () => observer.disconnect();
    }, [origin.x, origin.y, showFill]);

    const setMergedRef = React.useCallback((node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      assignRef(ref, node);
    }, [ref]);

    return (
      <motion.button
        {...props}
        ref={setMergedRef}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        data-active={showFill || undefined}
        data-pressed={pressed || undefined}
        className={cn("origin-button", `origin-button-${variant}`, `origin-button-${size}`, className)}
        onBlur={(event) => {
          onBlur?.(event);
          setPressed(false);
          if (!event.defaultPrevented) setHovered(false);
        }}
        onClick={onClick}
        onFocus={(event) => {
          onFocus?.(event);
          if (isDisabled || event.defaultPrevented || !event.currentTarget.matches(":focus-visible")) return;
          updateFromCenter();
          setHovered(true);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || isDisabled || event.repeat || (event.key !== " " && event.key !== "Enter")) return;
          if (event.key === " ") event.preventDefault();
          updateFromCenter();
          setPressed(true);
          setHovered(true);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          if (event.key !== " " && event.key !== "Enter") return;
          setPressed(false);
          if (!event.currentTarget.matches(":focus-visible")) setHovered(false);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          setPressed(false);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || isDisabled || event.button !== 0) return;
          updateFromPointer(event);
          setPressed(true);
          setHovered(true);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (event.defaultPrevented || isDisabled) return;
          updateFromPointer(event);
          setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          setHovered(false);
          setPressed(false);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          setPressed(false);
        }}
        whileTap={isDisabled ? undefined : { scale: 0.985 }}
      >
        <motion.span
          animate={{ scale: showFill && coverSize > 0 ? 1 : 0 }}
          aria-hidden
          className="origin-button-fill"
          initial={false}
          style={{ height: coverSize, left: origin.x, top: origin.y, width: coverSize }}
          transition={{ duration: FILL_DURATION, ease: FILL_EASE }}
        />
        <span className="origin-button-label">
          {loading ? <span className="origin-button-spinner" aria-hidden /> : null}
          {children}
        </span>
      </motion.button>
    );
  },
);
OriginButton.displayName = "OriginButton";

export { OriginButton };
export type { OriginButtonProps };

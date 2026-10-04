"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface AlertProps {
  icon?: ReactNode;
  title: ReactNode;
  message: ReactNode;
  timeout?: number;
  onDismiss?: () => void;
}

export function Alert({ icon, title, message, timeout = 6000, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible || timeout <= 0) return;
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, timeout);
    return () => window.clearTimeout(timer);
  }, [onDismiss, timeout, visible]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVisible(false);
        onDismiss?.();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onDismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="alert-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -14, scale: .97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: .98 }}
          transition={{ duration: .25, ease: [0.22, 1, 0.36, 1] }}
        >
          {icon && <span className="alert-icon">{icon}</span>}
          <div className="alert-copy">
            <strong>{title}</strong>
            <p>{message}</p>
          </div>
          <button
            type="button"
            className="alert-dismiss"
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            aria-label="Dismiss notification"
          >
            <X aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeEvent = "cobbins-theme-change";

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function applyTheme(theme: Theme, persist: boolean) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (persist) window.localStorage.setItem("cobbins-theme", theme);
}

function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleThemeEvent = () => onChange();
  const handleSystemChange = () => {
    const saved = window.localStorage.getItem("cobbins-theme");
    if (saved === "light" || saved === "dark") return;
    applyTheme(media.matches ? "dark" : "light", false);
    onChange();
  };

  window.addEventListener(themeEvent, handleThemeEvent);
  media.addEventListener("change", handleSystemChange);
  return () => {
    window.removeEventListener(themeEvent, handleThemeEvent);
    media.removeEventListener("change", handleSystemChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const setTheme = useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme, true);
    window.dispatchEvent(new Event(themeEvent));
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = getThemeSnapshot() === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
    window.dispatchEvent(new Event(themeEvent));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

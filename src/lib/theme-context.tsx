"use client";

// ─────────────────────────────────────────────────────────────────
// Theme context — provides the active token set to all components.
//
// WEB: persists to localStorage, applies .light class on <html>
//      for the small number of CSS rules that can't be done inline.
// RN: swap the persistence to AsyncStorage and remove the
//     document.documentElement class manipulation.
// ─────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { DARK, LIGHT, type TokenSet } from "./tokens";

type Mode = "dark" | "light";

interface ThemeContextValue {
  tokens: TokenSet;
  mode: Mode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  tokens: DARK,
  mode: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("dark");

  // Initialise from localStorage (runs client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tfh-mode") as Mode | null;
      if (saved === "light") {
        setMode("light");
        document.documentElement.classList.add("light");
      }
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next: Mode = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("tfh-mode", next);
        if (next === "light") {
          document.documentElement.classList.add("light");
        } else {
          document.documentElement.classList.remove("light");
        }
      } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ tokens: mode === "dark" ? DARK : LIGHT, mode, toggle }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// This is the hook every component uses to access design tokens.
// On RN: import this same hook — it works identically.
export function useTheme() {
  return useContext(ThemeContext);
}

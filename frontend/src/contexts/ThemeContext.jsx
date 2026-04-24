// src/contexts/ThemeContext.jsx
// KokMaisa — Global theme provider (dark / light)
// Wrap your <App /> with <ThemeProvider> in main.jsx

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("km-theme");
      return saved === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    // Apply to <html> so CSS selectors [data-theme="light"] work everywhere
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("km-theme", theme); } catch {}

    const r = document.documentElement.style;
    if (theme === "dark") {
      r.setProperty("--bg-base",       "#061309");
      r.setProperty("--bg-surface",    "rgba(255,255,255,.04)");
      r.setProperty("--text-primary",  "#ffffff");
      r.setProperty("--text-secondary","rgba(255,255,255,.6)");
      r.setProperty("--text-muted",    "rgba(255,255,255,.35)");
      r.setProperty("--border",        "rgba(255,255,255,.08)");
      r.setProperty("--accent",        "#4ade80");
      r.setProperty("--accent-dim",    "rgba(74,222,128,.12)");
    } else {
      r.setProperty("--bg-base",       "#f5fcf2");
      r.setProperty("--bg-surface",    "rgba(255,255,255,.9)");
      r.setProperty("--text-primary",  "#1a2e1a");
      r.setProperty("--text-secondary","rgba(20,55,20,.65)");
      r.setProperty("--text-muted",    "rgba(20,55,20,.4)");
      r.setProperty("--border",        "rgba(34,197,94,.18)");
      r.setProperty("--accent",        "#16a34a");
      r.setProperty("--accent-dim",    "rgba(22,163,74,.1)");
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
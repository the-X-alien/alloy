import React, { createContext, useContext, useState, useCallback } from "react";
import { COLORS as DEFAULT_COLORS } from "../theme.js";

const THEMES: Record<string, typeof DEFAULT_COLORS> = {
  dark: DEFAULT_COLORS,
  light: {
    ...DEFAULT_COLORS,
    bg: "#f5f5f5",
    bgPanel: "#ffffff",
    bgElement: "#e8e8e8",
    bgHover: "#dcdcdc",
    border: "#b0b0b0",
    borderActive: "#909090",
    borderSubtle: "#cccccc",
    text: "#1a1a1a",
    textMuted: "#606060",
    textDim: "#909090",
  },
  oled: {
    ...DEFAULT_COLORS,
    bg: "#000000",
    bgPanel: "#050505",
    bgElement: "#0a0a0a",
    bgHover: "#111111",
  },
};

interface ThemeContextType {
  colors: typeof DEFAULT_COLORS;
  themeName: string;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DEFAULT_COLORS,
  themeName: "dark",
  setTheme: () => { },
});

export function ThemeProvider({ children, initial = "dark" }: { children: React.ReactNode; initial?: string }) {
  const [themeName, setThemeName] = useState(initial);
  const colors = THEMES[themeName] ?? DEFAULT_COLORS;

  const setTheme = useCallback((name: string) => {
    if (THEMES[name]) setThemeName(name);
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

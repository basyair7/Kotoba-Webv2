"use client";

import { useLocalStorageState } from "./useLocalStorageState";

type Theme = "light" | "dark";
const THEMES: readonly Theme[] = ["light", "dark"];

export function useTheme() {
  const [theme, setTheme] = useLocalStorageState("theme", "dark", THEMES);

  return {
    theme,
    toggleTheme: () => setTheme(theme === "light" ? "dark" : "light"),
  };
}

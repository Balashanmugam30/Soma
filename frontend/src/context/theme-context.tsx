"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { saveThemePreference } from "@/lib/firestore";
import { useAppStore } from "@/store/app-store";
import type { ThemeMode } from "@/types";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: ThemeMode) {
  if (theme !== "system") {
    return theme;
  }

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeState, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    return (window.localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode | null) ?? "system";
  });
  const userProfile = useAppStore((state) => state.userProfile);
  const theme = userProfile?.themePreference ?? themeState;

  useEffect(() => {
    const resolved = resolveTheme(theme);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.theme = resolved;

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const nextTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
        document.documentElement.dataset.theme = nextTheme;
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    return undefined;
  }, [theme]);

  const setTheme = useCallback(
    async (nextTheme: ThemeMode) => {
      setThemeState(nextTheme);
      window.localStorage.setItem(STORAGE_KEYS.theme, nextTheme);

      if (userProfile?.id) {
        await saveThemePreference(userProfile.id, nextTheme);
      }
    },
    [userProfile],
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme: resolveTheme(theme),
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

"use client";

import { Globe, MoonStar, Settings, SunMedium } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useTheme } from "@/context/theme-context";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import type { AuthUser } from "@/types";

interface TopbarProps {
  user: AuthUser | null;
  onOpenSettings: () => void;
}

export function Topbar({ user, onOpenSettings }: TopbarProps) {
  const { dictionary, language, setLanguage } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="glass-panel flex items-center justify-end gap-3 rounded-full px-3 py-3 sm:px-4">
      <label className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted transition hover:bg-hover hover:text-foreground">
        <Globe size={16} />
        <span className="hidden sm:inline">{dictionary.topbar.language}</span>
        <select
          value={language}
          onChange={(event) => void setLanguage(event.target.value as typeof language)}
          className="bg-transparent text-sm outline-none"
          aria-label={dictionary.topbar.language}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => void setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="rounded-full p-3 text-muted transition hover:bg-hover hover:text-foreground"
        aria-label={dictionary.topbar.theme}
      >
        {resolvedTheme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        className="rounded-full p-3 text-muted transition hover:bg-hover hover:text-foreground"
        aria-label={dictionary.topbar.settings}
      >
        <Settings size={18} />
      </button>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground shadow-soft"
        style={
          user?.photoURL
            ? {
                backgroundImage: `url(${user.photoURL})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
        aria-label={user?.displayName ?? "SOMA user"}
        title={user?.displayName ?? "SOMA user"}
      >
        {!user?.photoURL ? user?.displayName?.slice(0, 1).toUpperCase() ?? "S" : null}
      </div>
    </div>
  );
}

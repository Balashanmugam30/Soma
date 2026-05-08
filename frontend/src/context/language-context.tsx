"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { saveLanguagePreference } from "@/lib/firestore";
import { dictionaries } from "@/lib/translations";
import { useAppStore } from "@/store/app-store";
import type { DictionaryShape, Language } from "@/types";

interface LanguageContextValue {
  language: Language;
  dictionary: DictionaryShape;
  t: (key: string) => string;
  isRTL: boolean;
  setLanguage: (language: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "ta" || value === "hi";
}

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  const current = window.localStorage.getItem(STORAGE_KEYS.language);
  const legacyCurrent = window.localStorage.getItem("soma_lang");
  const legacy = window.localStorage.getItem("soma-language");
  const resolved = isLanguage(current)
    ? current
    : isLanguage(legacyCurrent)
      ? legacyCurrent
      : isLanguage(legacy)
        ? legacy
        : null;

  if (resolved) {
    window.localStorage.setItem(STORAGE_KEYS.language, resolved);
    window.localStorage.removeItem("soma_lang");
    window.localStorage.removeItem("soma-language");
  }

  return resolved;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const languageState = useAppStore((state) => state.language);
  const setLanguageState = useAppStore((state) => state.setLanguage);
  const userProfile = useAppStore((state) => state.userProfile);
  const language = userProfile?.preferredLanguage ?? languageState ?? "en";

  useEffect(() => {
    const storedLanguage = readStoredLanguage();
    if (storedLanguage && storedLanguage !== languageState) {
      setLanguageState(storedLanguage);
      return;
    }

    if (!storedLanguage && languageState !== "en") {
      window.localStorage.setItem(STORAGE_KEYS.language, languageState);
    }
  }, [languageState, setLanguageState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextLanguage = userProfile?.preferredLanguage ?? readStoredLanguage() ?? "en";
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEYS.language, nextLanguage);
    window.localStorage.removeItem("soma_lang");
    window.localStorage.removeItem("soma-language");
  }, [setLanguageState, userProfile?.preferredLanguage]);

  const setLanguage = useCallback(
    async (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      window.localStorage.setItem(STORAGE_KEYS.language, nextLanguage);
      window.localStorage.removeItem("soma_lang");
      window.localStorage.removeItem("soma-language");

      if (userProfile?.id) {
        await saveLanguagePreference(userProfile.id, nextLanguage);
      }
    },
    [setLanguageState, userProfile],
  );

  const dictionary = dictionaries[language] ?? dictionaries.en;
  const t = useMemo(
    () => (key: string) => {
      const readKey = (source: unknown) =>
        key.split(".").reduce<unknown>((current, part) => {
          if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
            return (current as Record<string, unknown>)[part];
          }
          return undefined;
        }, source);

      const localized = readKey(dictionary);
      if (typeof localized === "string") {
        return localized;
      }

      const fallback = readKey(dictionaries.en);
      return typeof fallback === "string" ? fallback : key;
    },
    [dictionary],
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        dictionary,
        t,
        isRTL: false,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

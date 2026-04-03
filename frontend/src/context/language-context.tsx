"use client";

import {
  createContext,
  useContext,
  useCallback,
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
  setLanguage: (language: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const languageState = useAppStore((state) => state.language);
  const setLanguageState = useAppStore((state) => state.setLanguage);
  const userProfile = useAppStore((state) => state.userProfile);
  const storedLanguage =
    typeof window !== "undefined"
      ? ((window.localStorage.getItem(STORAGE_KEYS.language) as Language | null) ?? null)
      : null;
  const language = userProfile?.preferredLanguage ?? storedLanguage ?? languageState;

  const setLanguage = useCallback(
    async (nextLanguage: Language) => {
      setLanguageState(nextLanguage);
      window.localStorage.setItem(STORAGE_KEYS.language, nextLanguage);

      if (userProfile?.id) {
        await saveLanguagePreference(userProfile.id, nextLanguage);
      }
    },
    [setLanguageState, userProfile],
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        dictionary: dictionaries[language],
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

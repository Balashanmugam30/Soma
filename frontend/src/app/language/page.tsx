"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { LANGUAGE_OPTIONS, STORAGE_KEYS } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import type { Language } from "@/types";

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { user, loading, profileReady } = useAuth();
  const { dictionary, language, setLanguage } = useLanguage();
  const userProfile = useAppStore((state) => state.userProfile);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      console.log("[SOMA] Language page waiting for authenticated user");
    }
  }, [loading, user]);

  useEffect(() => {
    if (!profileReady || !userProfile?.languageSelected) {
      return;
    }

    const restoredLanguage = userProfile.preferredLanguage ?? language;
    window.localStorage.setItem(STORAGE_KEYS.language, restoredLanguage);
    setSelectedLanguage(restoredLanguage);
  }, [language, profileReady, userProfile?.languageSelected, userProfile?.preferredLanguage]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center px-6">
        <div className="rounded-3xl bg-[var(--bg-secondary)] px-8 py-6 text-sm text-[var(--text-main)] opacity-70">
          {dictionary.language.loading}
        </div>
      </main>
    );
  }

  async function handleContinue() {
    console.log("Selected language:", selectedLanguage);
    window.localStorage.setItem(STORAGE_KEYS.language, selectedLanguage);
    await setLanguage(selectedLanguage);
    router.push("/workspace");
  }

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center px-6">
      <div className="w-full max-w-4xl text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-muted">SOMA</p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          {dictionary.language.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
          {dictionary.language.subtitle}
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {LANGUAGE_OPTIONS.map((lang) => {
            const isSelected = selectedLanguage === lang.value;

            return (
            <button
              key={lang.value}
              type="button"
              onClick={() => {
                console.log("Selected language:", lang.value);
                setSelectedLanguage(lang.value);
              }}
              className={`cursor-pointer rounded-lg px-4 py-3 ${
                isSelected
                  ? "bg-white text-black"
                  : "bg-[var(--bg-secondary)] text-[var(--text-main)]"
              }`}
            >
              <p className="text-lg font-medium">{lang.label}</p>
            </button>
          )})}
        </div>
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!user}
          className="mt-10 inline-flex rounded-full bg-[var(--bg-secondary)] px-7 py-4 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {dictionary.language.continue}
        </button>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { LANGUAGE_OPTIONS } from "@/lib/constants";
import type { Language } from "@/types";

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { dictionary, language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  async function handleContinue() {
    await setLanguage(selectedLanguage);
    router.push("/workspace");
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-4xl text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-muted">SOMA</p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          {dictionary.language.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
          {dictionary.language.subtitle}
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedLanguage(option.value)}
              className={`surface-card rounded-[30px] px-6 py-8 text-left transition hover:-translate-y-0.5 ${
                selectedLanguage === option.value ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <p className="text-lg font-medium">{option.label}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleContinue()}
          className="mt-10 inline-flex rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground transition hover:opacity-90"
        >
          {dictionary.language.continue}
        </button>
      </div>
    </main>
  );
}

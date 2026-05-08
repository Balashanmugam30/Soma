"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { STORAGE_KEYS } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";

export default function LandingPage() {
  const router = useRouter();
  const { signInWithGoogle, loading, profileReady, user, isConfigured } = useAuth();
  const { dictionary, t } = useLanguage();
  const userProfile = useAppStore((state) => state.userProfile);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !profileReady) {
      return;
    }

    const storedLanguage =
      window.localStorage.getItem(STORAGE_KEYS.language) ??
      window.localStorage.getItem("soma_lang") ??
      window.localStorage.getItem("soma-language");
    const profileLanguage = userProfile?.languageSelected ? userProfile.preferredLanguage : null;
    const resolvedLanguage = storedLanguage ?? profileLanguage;

    if (resolvedLanguage) {
      window.localStorage.setItem(STORAGE_KEYS.language, resolvedLanguage);
    }

    router.replace(resolvedLanguage ? "/workspace" : "/language");
  }, [loading, profileReady, router, user, userProfile?.languageSelected, userProfile?.preferredLanguage]);

  async function handleSignIn() {
    console.log("[SOMA] Sign-in button clicked");
    setError(null);
    setSigningIn(true);

    try {
      const nextUser = await signInWithGoogle();

      if (nextUser) {
        router.push("/language");
        return;
      }

      setError("Unable to sign in.");
    } catch (nextError) {
      console.error("[SOMA] Landing page sign-in failed", nextError);
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-6 text-[var(--text-main)]">
      <div className="w-full max-w-4xl text-center">
        <p className="text-sm uppercase tracking-[0.42em] text-muted">{t("labels.aiWorkspace")}</p>
        <h1 className="mt-6 text-[min(24vw,8rem)] font-semibold tracking-[-0.08em] text-foreground">
          Soma
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-8 text-muted sm:text-lg">
          {dictionary.landing.subtitle}
        </p>
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn || !isConfigured}
            className="inline-flex min-w-64 items-center justify-center rounded-full bg-[var(--bg-secondary)] px-7 py-4 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingIn ? dictionary.landing.signInLoading : dictionary.landing.signIn}
          </button>
          {loading ? <p className="text-sm text-muted">{dictionary.landing.checkingSession}</p> : null}
          {!isConfigured ? (
            <p className="text-sm text-muted">{dictionary.system.firebaseMissing}</p>
          ) : null}
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        </div>
        <p className="mt-10 text-xs text-muted">Soma AI Agent System - Powered by Cloud Run</p>
      </div>
    </main>
  );
}

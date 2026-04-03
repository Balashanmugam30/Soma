"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { useAppStore } from "@/store/app-store";

export default function LandingPage() {
  const router = useRouter();
  const { signIn, loading, user, isConfigured } = useAuth();
  const { dictionary } = useLanguage();
  const userProfile = useAppStore((state) => state.userProfile);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !userProfile) {
      return;
    }

    router.replace(userProfile.languageSelected ? "/workspace" : "/language");
  }, [loading, router, user, userProfile]);

  async function handleSignIn() {
    setError(null);
    setSigningIn(true);

    try {
      await signIn();
      router.push("/language");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-4xl text-center">
        <div className="mx-auto h-32 w-32 rounded-full bg-white/70 blur-3xl" />
        <p className="text-sm uppercase tracking-[0.42em] text-muted">AI Workspace</p>
        <h1 className="mt-6 text-[min(24vw,8rem)] font-semibold tracking-[-0.08em] text-foreground">
          SOMA
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-8 text-muted sm:text-lg">
          {dictionary.landing.subtitle}
        </p>
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={loading || signingIn || !isConfigured}
            className="inline-flex min-w-64 items-center justify-center rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingIn ? dictionary.landing.signInLoading : dictionary.landing.signIn}
          </button>
          {!isConfigured ? (
            <p className="text-sm text-muted">{dictionary.system.firebaseMissing}</p>
          ) : null}
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        </div>
      </div>
    </main>
  );
}

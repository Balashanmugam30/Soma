"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/app-store";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const userProfile = useAppStore((state) => state.userProfile);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/");
      return;
    }

    if (userProfile && !userProfile.languageSelected) {
      router.replace("/language");
    }
  }, [loading, router, user, userProfile]);

  if (loading || !user || !userProfile) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="surface-card rounded-3xl px-8 py-6 text-sm text-muted">
          Loading workspace...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

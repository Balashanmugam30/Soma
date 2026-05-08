"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading || timedOut) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [loading, timedOut]);

  useEffect(() => {
    if (loading && !timedOut) {
      return;
    }

    if (!user) {
      router.replace("/");
      return;
    }
  }, [loading, router, timedOut, user]);

  if (loading && !timedOut) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="surface-card rounded-3xl px-8 py-6 text-sm text-muted">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="surface-card rounded-3xl px-8 py-6 text-sm text-muted">
          Redirecting...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

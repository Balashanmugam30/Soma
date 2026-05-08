"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { dictionaries } from "@/lib/translations";
import type { Language } from "@/types";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SOMA runtime error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const storedLanguage =
        typeof window !== "undefined"
          ? ((window.localStorage.getItem(STORAGE_KEYS.language) as Language | null) ??
            (window.localStorage.getItem("soma_lang") as Language | null) ??
            (window.localStorage.getItem("soma-language") as Language | null) ??
            "en")
          : "en";
      const dictionary = dictionaries[storedLanguage] ?? dictionaries.en;

      return (
        <div className="app-shell flex min-h-screen items-center justify-center px-6">
          <div className="surface-card max-w-lg rounded-3xl p-8 text-center">
            <p className="text-sm uppercase tracking-[0.24em] text-muted">SOMA</p>
            <h2 className="mt-4 text-3xl font-semibold">{dictionary.system.runtimeIssueTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {dictionary.system.runtimeIssueBody}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

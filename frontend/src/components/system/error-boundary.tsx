"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

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
      return (
        <div className="app-shell flex min-h-screen items-center justify-center px-6">
          <div className="surface-card max-w-lg rounded-3xl p-8 text-center">
            <p className="text-sm uppercase tracking-[0.24em] text-muted">SOMA</p>
            <h2 className="mt-4 text-3xl font-semibold">We hit a runtime issue.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Refresh the page to recover the workspace.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

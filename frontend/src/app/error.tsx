"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="surface-card w-full max-w-xl rounded-3xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-muted">SOMA</p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Something went wrong.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {error.message || "An unexpected error interrupted the workspace."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="surface-card w-full max-w-lg rounded-3xl p-8 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">Soma</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The page you’re looking for isn’t here. Let’s take you back to the workspace.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

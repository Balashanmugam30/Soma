export default function Loading() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="surface-card w-full max-w-md rounded-3xl p-8 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">Soma</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-foreground/50" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-foreground/35 [animation-delay:120ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-foreground/20 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

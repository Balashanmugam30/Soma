"use client";

interface WorkspaceSkeletonProps {
  label: string;
}

export function WorkspaceSkeleton({ label }: WorkspaceSkeletonProps) {
  return (
    <div className="app-shell min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1580px] gap-4 lg:min-h-[calc(100vh-3rem)] lg:gap-6">
        <aside className="hidden w-80 rounded-[32px] bg-surface px-4 py-5 shadow-soft lg:block">
          <div className="h-5 w-24 animate-pulse rounded-full bg-hover" />
          <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-hover" />
          <div className="mt-8 space-y-3">
            <div className="h-20 animate-pulse rounded-3xl bg-hover" />
            <div className="h-20 animate-pulse rounded-3xl bg-hover" />
            <div className="h-20 animate-pulse rounded-3xl bg-hover" />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col rounded-[32px]">
          <div className="glass-panel h-16 animate-pulse rounded-full" />
          <div className="mt-4 flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <div className="flex-1 space-y-6 px-1 py-8">
                <div className="h-28 animate-pulse rounded-[28px] bg-surface shadow-soft" />
                <div className="ml-auto h-24 w-3/4 animate-pulse rounded-[28px] bg-surface shadow-soft" />
                <div className="h-32 animate-pulse rounded-[28px] bg-surface shadow-soft" />
              </div>
              <div className="mt-auto pb-4 pt-6 sm:pb-8">
                <div className="glass-panel h-20 animate-pulse rounded-[28px]" />
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center px-6">
        <div className="glass-panel rounded-full px-5 py-3 text-sm text-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

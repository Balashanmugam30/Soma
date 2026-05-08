"use client";

import { useLanguage } from "@/context/language-context";

export function ChatEmptyState({
  onPromptClick,
}: {
  onPromptClick: (prompt: string) => void;
}) {
  const { dictionary } = useLanguage();

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-2xl text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-muted">SOMA</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {dictionary.workspace.startFirstConversation}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-sm leading-7 text-muted sm:text-base">
          {dictionary.workspace.emptySubtitle}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {dictionary.workspace.examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onPromptClick(example)}
              className="rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-main)] transition hover:bg-[var(--bg-main)]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

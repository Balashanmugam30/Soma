"use client";

import { Loader2, Mic, Plus, SendHorizontal } from "lucide-react";
import { useLanguage } from "@/context/language-context";

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  onVoiceInput: () => void;
  loading: boolean;
  listening: boolean;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  onNewChat,
  onVoiceInput,
  loading,
  listening,
}: ChatInputBarProps) {
  const { dictionary } = useLanguage();

  return (
    <div className="sticky bottom-0 pb-4 pt-6 sm:pb-8">
      <div className="glass-panel mx-auto flex max-w-3xl items-center gap-3 rounded-[28px] px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onNewChat}
          aria-label={dictionary.workspace.newChat}
          className="rounded-full p-3 text-muted transition hover:bg-hover hover:text-foreground"
        >
          <Plus size={18} />
        </button>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={dictionary.chat.placeholder}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted sm:text-base"
        />
        <button
          type="button"
          onClick={onVoiceInput}
          aria-label={dictionary.chat.mic}
          className="rounded-full p-3 text-muted transition hover:bg-hover hover:text-foreground"
        >
          {listening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={loading}
          aria-label={dictionary.chat.send}
          className="inline-flex rounded-full bg-accent p-3 text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
        </button>
      </div>
    </div>
  );
}

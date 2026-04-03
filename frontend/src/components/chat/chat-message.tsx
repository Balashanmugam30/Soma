"use client";

import { Volume2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { formatTime } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";
import { WorkflowSteps } from "@/components/chat/workflow-steps";

interface ChatMessageProps {
  message: ChatMessageType;
  onSpeak: (text: string) => void;
}

export function ChatMessage({ message, onSpeak }: ChatMessageProps) {
  const { dictionary } = useLanguage();
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[88%] sm:max-w-[78%]">
        <div
          className={`surface-card rounded-[28px] px-5 py-4 sm:px-6 sm:py-5 ${
            isUser ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-7">
            {message.content}
          </p>
          {message.workflow && !isUser ? <WorkflowSteps steps={message.workflow} /> : null}
        </div>
        <div
          className={`mt-2 flex items-center gap-3 px-1 text-xs text-muted ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          {!isUser ? (
            <button
              type="button"
              onClick={() => onSpeak(message.content)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-hover hover:text-foreground"
              aria-label={dictionary.chat.speak}
            >
              <Volume2 size={14} />
              {dictionary.chat.speak}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

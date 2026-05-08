"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Check, Copy, PencilLine, Volume2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { formatTime } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onSpeak: (message: ChatMessageType) => Promise<void> | void;
  onCopy: (text: string) => Promise<void> | void;
  onEdit: (message: ChatMessageType) => void;
  isSpeaking?: boolean;
  animate?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onSpeak,
  onCopy,
  onEdit,
  isSpeaking = false,
  animate = false,
}: ChatMessageProps) {
  const { dictionary } = useLanguage();
  const isUser = message.role === "user";
  const workflowLength = message.workflow?.length ?? 0;
  const shouldAnimateSteps = false;
  const shouldAnimateContent = animate && !isUser;
  const [copied, setCopied] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(shouldAnimateSteps ? 0 : workflowLength);
  const [visibleContentLength, setVisibleContentLength] = useState(
    shouldAnimateContent ? 0 : message.content.length,
  );

  useEffect(() => {
    if (!shouldAnimateSteps) {
      return;
    }

    let stepIndex = 0;
    let timeoutId: number | null = null;
    let active = true;

    const revealNextStep = () => {
      if (!active) {
        return;
      }

      stepIndex += 1;
      setVisibleSteps(Math.min(stepIndex, workflowLength));

      if (stepIndex >= workflowLength) {
        return;
      }

      timeoutId = window.setTimeout(revealNextStep, 360 + stepIndex * 90);
    };

    timeoutId = window.setTimeout(revealNextStep, 320);

    return () => {
      active = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [shouldAnimateSteps, workflowLength]);

  useEffect(() => {
    if (!shouldAnimateContent || visibleSteps < workflowLength) {
      return;
    }

    let contentIndex = 0;
    let timeoutId: number | null = null;
    let active = true;

    const revealContent = () => {
      if (!active) {
        return;
      }

      const nextChunk = Math.max(8, Math.min(20, Math.ceil(message.content.length / 22)));
      contentIndex += nextChunk;
      setVisibleContentLength(Math.min(contentIndex, message.content.length));

      if (contentIndex >= message.content.length) {
        return;
      }

      const nextDelay = Math.max(24, 54 - Math.min(contentIndex / 12, 22));
      timeoutId = window.setTimeout(revealContent, nextDelay);
    };

    timeoutId = window.setTimeout(revealContent, 140);

    return () => {
      active = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [message.content.length, shouldAnimateContent, visibleSteps, workflowLength]);

  const displayedContentLength = shouldAnimateContent
    ? visibleContentLength
    : message.content.length;

  const visibleContent = useMemo(
    () => message.content.slice(0, displayedContentLength),
    [displayedContentLength, message.content],
  );

  async function handleCopy() {
    await onCopy(message.content);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  const actionButtonClass =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition hover:bg-[var(--bg-secondary)]";

  return (
    <div className={`animate-fadeIn flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[88%] sm:max-w-[78%]">
        <div
          className={`rounded-[28px] px-5 py-4 sm:px-6 sm:py-5 ${
            isUser ? "bg-[var(--bg-secondary)] text-[var(--text-main)]" : "bg-transparent text-[var(--text-main)]"
          }`}
        >
          {message.attachments?.length ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <span
                  key={`${attachment.filename}-${attachment.type}`}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    isUser ? "bg-[var(--bg-main)] text-[var(--text-main)]" : "bg-[var(--bg-secondary)] text-[var(--text-main)]"
                  }`}
                >
                  {attachment.filename}
                </span>
              ))}
            </div>
          ) : null}
          <div>
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text-main)]">
              {visibleContent}
              {shouldAnimateContent && displayedContentLength < message.content.length ? (
                <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-full bg-[var(--text-main)] align-middle opacity-70" />
              ) : null}
            </p>
            {message.steps?.length ? (
              <div className="mt-2 space-y-1 text-xs text-[var(--text-main)] opacity-55">
                {message.steps.map((step, index) => (
                  <div key={`${step.agent}-${step.intent}-${index}`}>
                    {step.agent} -&gt; {step.intent}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div
          className={`mt-2 flex items-center gap-3 px-1 text-xs text-muted ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          <button
            type="button"
            onClick={() => void onSpeak(message)}
            className={actionButtonClass}
            aria-label={dictionary.chat.speak}
          >
            {isSpeaking ? (
              <>
                <span className="flex h-4 items-end gap-0.5">
                  <span className="soundbar h-2 w-0.5 rounded-full bg-[var(--text-main)] opacity-85" />
                  <span className="soundbar h-3.5 w-0.5 rounded-full bg-[var(--text-main)] opacity-85 [animation-delay:120ms]" />
                  <span className="soundbar h-2.5 w-0.5 rounded-full bg-[var(--text-main)] opacity-85 [animation-delay:240ms]" />
                </span>
                Speaking
              </>
            ) : (
              <>
                <Volume2 size={14} />
                {dictionary.chat.speak}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={actionButtonClass}
            aria-label="Copy message"
          >
            {copied ? (
              <>
                <Check size={14} />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy
              </>
            )}
          </button>
          {isUser ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(message)}
                className={actionButtonClass}
                aria-label="Edit message"
              >
                <PencilLine size={14} />
                Edit
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
});

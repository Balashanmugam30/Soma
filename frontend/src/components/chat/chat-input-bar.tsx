"use client";

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, Plus, SendHorizontal } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import type { Skill } from "@/types";

interface AgentOption {
  id: string;
  label: string;
  description: string;
  kind: "built-in" | "custom";
}

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  skills: Skill[];
  agentOptions?: AgentOption[];
  onSelectAgentOption?: (option: AgentOption) => void;
  onSelectSkill?: (skillId: string) => void;
  onAttach: () => void;
  onClearAttachment?: () => void;
  onVoiceInput: () => void;
  loading: boolean;
  listening: boolean;
  processingVoice?: boolean;
  attachmentName?: string | null;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  agentOptions = [],
  onSelectAgentOption,
  onAttach,
  onClearAttachment,
  onVoiceInput,
  loading,
  listening,
  processingVoice = false,
  attachmentName,
}: ChatInputBarProps) {
  const { dictionary } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canSend = value.trim().length > 0;
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  function getSkillTriggerMeta(inputValue: string) {
    const match = inputValue.match(/\$([^\s$]*)$/);
    if (!match) {
      return null;
    }

    return {
      query: match[1]?.toLowerCase() ?? "",
    };
  }

  function updateSkillMenu(inputValue: string) {
    const triggerMeta = getSkillTriggerMeta(inputValue);
    if (!triggerMeta) {
      setShowAgentMenu(false);
      setActiveIndex(0);
      return;
    }
    setShowAgentMenu(true);
    setActiveIndex(0);
  }

  const agentTrigger = useMemo(() => getSkillTriggerMeta(value), [value]);
  const filteredAgents = useMemo(() => {
    if (!agentTrigger) {
      return [];
    }

    return agentOptions.filter((agent) =>
      agent.label.toLowerCase().includes(agentTrigger.query),
    );
  }, [agentOptions, agentTrigger]);
  const isAgentMenuOpen = showAgentMenu && agentTrigger !== null;

  function resizeTextarea() {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
  }

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowAgentMenu(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function focusTextareaAtEnd(nextValue: string) {
    window.requestAnimationFrame(() => {
      if (!textareaRef.current) {
        return;
      }

      textareaRef.current.focus();
      const caret = nextValue.length;
      textareaRef.current.setSelectionRange(caret, caret);
    });
  }

  function selectAgent(option: AgentOption) {
    const nextValue = value.replace(/\$[^\s$]*$/, "").trimEnd();
    onChange(nextValue);
    onSelectAgentOption?.(option);
    setShowAgentMenu(false);
    setActiveIndex(0);
    focusTextareaAtEnd(nextValue);
  }

  function handleInputChange(nextValue: string) {
    onChange(nextValue);
    updateSkillMenu(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isAgentMenuOpen && filteredAgents.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % filteredAgents.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + filteredAgents.length) % filteredAgents.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        selectAgent(filteredAgents[activeIndex] ?? filteredAgents[0]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setShowAgentMenu(false);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  function handleSendClick() {
    onSend();
  }

  return (
    <div className="w-full">
      {attachmentName ? (
        <div className="mx-auto mb-3 flex max-w-3xl items-center gap-2 px-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-secondary)] px-3 py-2 shadow-soft text-[var(--text-main)]">
            {dictionary.workspace.attached}: {attachmentName}
            {onClearAttachment ? (
              <button
                type="button"
                onClick={onClearAttachment}
                aria-label={dictionary.common.close}
                className="rounded-full px-2 py-1 text-xs transition hover:bg-[var(--bg-main)]"
              >
                x
              </button>
            ) : null}
          </span>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="relative mx-auto max-w-3xl skill-dropdown"
        style={{ pointerEvents: "auto" }}
      >
        {isAgentMenuOpen ? (
          <div className="absolute inset-x-4 bottom-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[24px] bg-[var(--bg-secondary)] p-2 shadow-soft transition-all duration-200 ease-in-out sm:left-5 sm:w-80 sm:right-auto">
            <div className="max-h-64 overflow-y-auto">
              {(filteredAgents.length > 0 ? filteredAgents : []).map((agent, index) => (
                <button
                  key={`${agent.kind}-${agent.id}`}
                  type="button"
                  onClick={() => selectAgent(agent)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[var(--bg-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                    index === activeIndex && "bg-[var(--bg-main)]",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--text-main)]">
                      {agent.label}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-main)] opacity-60">
                      {agent.description}
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--bg-main)] px-2.5 py-1 text-[11px] font-medium capitalize text-[var(--text-main)] opacity-60">
                    {agent.kind === "built-in" ? "agent" : "my agent"}
                  </span>
                </button>
              ))}
              {filteredAgents.length === 0 ? (
                <div className="px-3 py-3 text-sm text-[var(--text-main)] opacity-60">
                  {agentOptions.length === 0 ? "No agents available" : "No matching agents"}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex items-end rounded-xl bg-[var(--bg-secondary)] px-4 py-3">
          <button
            type="button"
            onClick={onAttach}
            aria-label={dictionary.chat.attach}
            className="mb-0.5 rounded-full p-3 text-[var(--text-main)] opacity-60 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <Plus size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-end">
            <div className="max-h-40 w-full overflow-y-auto">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => handleInputChange(event.target.value)}
                onInput={resizeTextarea}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={dictionary.chat.placeholder}
                maxLength={4000}
                className="min-h-[44px] w-full resize-none overflow-y-auto break-words whitespace-pre-wrap bg-transparent px-3 py-2 text-sm leading-relaxed text-[var(--text-main)] outline-none transition-all duration-200 focus:scale-[1.01] placeholder:text-[var(--text-main)] placeholder:opacity-45 sm:text-base"
                style={{ cursor: "text" }}
              />
            </div>
          </div>
          {listening ? (
            <button
              type="button"
              onClick={onVoiceInput}
              aria-label={dictionary.chat.mic}
              className="mb-0.5 self-end rounded-full px-3 py-2 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <div className="absolute h-8 w-8 rounded-full bg-white/20 animate-ping" />
                  <div className="relative h-3 w-3 rounded-full bg-white" />
                </div>
                <span className="text-sm text-[var(--text-main)] opacity-70 animate-pulse">
                  Listening...
                </span>
              </div>
            </button>
          ) : processingVoice ? (
            <div className="mb-0.5 self-end rounded-full px-3 py-2 text-sm text-[var(--text-main)] opacity-70 animate-pulse">
              Processing voice...
            </div>
          ) : (
            <button
              type="button"
              onClick={onVoiceInput}
              aria-label={dictionary.chat.mic}
              className="mb-0.5 self-end rounded-full p-3 text-[var(--text-main)] opacity-60 transition-all duration-200 ease-in-out hover:bg-[var(--bg-main)] hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <Mic size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!canSend}
            aria-label={dictionary.chat.send}
            className="mb-0.5 inline-flex self-end rounded-full bg-[var(--bg-main)] p-3 text-[var(--text-main)] transition-all duration-200 ease-in-out hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

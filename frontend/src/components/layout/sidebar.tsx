"use client";

import { BrainCircuit, Menu, PencilLine, PlusCircle, Sparkles, Trash2, X } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { extractSkillPreview, formatDateLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Conversation, Skill } from "@/types";

interface SidebarProps {
  open: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  skills: Skill[];
  selectedSkillId: string | null;
  onToggle: (open: boolean) => void;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onRenameConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversation: Conversation) => void;
  onSelectSkill: (skillId: string) => void;
  onCreateSkill: () => void;
}

export function Sidebar({
  open,
  conversations,
  activeConversationId,
  skills,
  selectedSkillId,
  onToggle,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onSelectSkill,
  onCreateSkill,
}: SidebarProps) {
  const { dictionary } = useLanguage();
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className="fixed left-4 top-4 z-30 rounded-full bg-surface p-3 shadow-soft transition hover:bg-hover lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>
      {open ? (
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden"
          aria-label="Close sidebar backdrop"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[min(22rem,86vw)] flex-col bg-surface px-4 py-5 shadow-soft transition-transform duration-300 lg:static lg:w-80 lg:translate-x-0 lg:rounded-[32px]",
          open ? "translate-x-0" : "-translate-x-[110%]",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted">SOMA</p>
            <p className="mt-2 text-xl font-semibold text-foreground">Workspace</p>
          </div>
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="rounded-full p-2 text-muted transition hover:bg-hover hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition hover:opacity-90"
        >
          <PlusCircle size={16} />
          {dictionary.workspace.newChat}
        </button>

        <section className="mt-8 min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2 px-2">
            <BrainCircuit size={16} className="text-muted" />
            <p className="text-sm font-medium text-foreground">
              {dictionary.sidebar.conversations}
            </p>
          </div>
          <div className="scrollbar-subtle mt-4 space-y-2 overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <p className="px-2 text-sm text-muted">{dictionary.sidebar.noConversations}</p>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "rounded-3xl px-3 py-3 transition hover:bg-hover",
                    activeConversationId === conversation.id && "bg-background",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {conversation.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDateLabel(conversation.updatedAt)}
                    </p>
                  </button>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRenameConversation(conversation)}
                      className="rounded-full p-2 text-muted transition hover:bg-surface hover:text-foreground"
                      aria-label={dictionary.sidebar.rename}
                    >
                      <PencilLine size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteConversation(conversation)}
                      className="rounded-full p-2 text-muted transition hover:bg-surface hover:text-foreground"
                      aria-label={dictionary.sidebar.delete}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-muted" />
              <p className="text-sm font-medium text-foreground">{dictionary.workspace.skills}</p>
            </div>
            <button
              type="button"
              onClick={onCreateSkill}
              className="rounded-full px-3 py-2 text-xs text-muted transition hover:bg-hover hover:text-foreground"
            >
              {dictionary.workspace.createSkill}
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {skills.length === 0 ? (
              <p className="px-2 text-sm text-muted">{dictionary.sidebar.noSkills}</p>
            ) : (
              skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => onSelectSkill(skill.id)}
                  className={cn(
                    "w-full rounded-3xl px-4 py-3 text-left transition hover:bg-hover",
                    selectedSkillId === skill.id && "bg-background",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{skill.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{skill.description}</p>
                </button>
              ))
            )}
          </div>
          {selectedSkill ? (
            <div className="mt-4 rounded-3xl bg-background px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                {dictionary.sidebar.skillPreview}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{selectedSkill.title}</p>
              <p className="mt-2 text-xs leading-6 text-muted">
                {extractSkillPreview(selectedSkill)}
              </p>
            </div>
          ) : null}
        </section>
      </aside>
    </>
  );
}

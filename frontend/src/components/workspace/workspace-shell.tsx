"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { ChatMessage } from "@/components/chat/chat-message";
import { InputModal } from "@/components/common/input-modal";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SettingsModal } from "@/components/settings/settings-modal";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { useSpeech } from "@/hooks/use-speech";
import {
  clearConversations,
  deleteConversation,
  renameConversation,
  saveConversation,
  saveSkill,
  trackAnalytics,
  updateMemoryProfile,
} from "@/lib/firestore";
import {
  buildConversation,
  createConversationTitle,
  createMessage,
  getId,
  normalizeWorkflowMessage,
  nowIso,
  sanitizeInput,
  withMessage,
} from "@/lib/utils";
import { postChatMessage } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type { Conversation, MemoryProfile, Skill } from "@/types";

function deriveMemory(
  message: string,
  skill: Skill | null,
  language: string,
  memoryHints: string[] = [],
): MemoryProfile {
  const lowered = message.toLowerCase();
  const repeatedPatterns = [
    lowered.includes("plan") ? "Planning-focused requests" : null,
    lowered.includes("study") ? "Learning and schedule support" : null,
    lowered.includes("task") ? "Task organization requests" : null,
  ].filter(Boolean) as string[];

  return {
    preferences: [
      `Preferred language: ${language}`,
      skill ? `Favorite skill: ${skill.title}` : "Favorite skill: General",
    ],
    repeatedPatterns: [...repeatedPatterns, ...memoryHints].slice(0, 6),
    usageHabits: [`Active hour: ${new Date().getHours()}:00`],
    lastSkillId: skill?.id ?? null,
    updatedAt: nowIso(),
  };
}

export function WorkspaceShell() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { dictionary, language } = useLanguage();
  const {
    isListening,
    listenOnce,
    speak,
    recognitionSupported,
  } = useSpeech();

  const conversations = useAppStore((state) => state.conversations);
  const activeConversationId = useAppStore((state) => state.activeConversationId);
  const skills = useAppStore((state) => state.skills);
  const selectedSkillId = useAppStore((state) => state.selectedSkillId);
  const chatStatus = useAppStore((state) => state.chatStatus);
  const error = useAppStore((state) => state.error);
  const mobileSidebarOpen = useAppStore((state) => state.mobileSidebarOpen);
  const settingsOpen = useAppStore((state) => state.settingsOpen);
  const upsertConversation = useAppStore((state) => state.upsertConversation);
  const removeConversation = useAppStore((state) => state.removeConversation);
  const setActiveConversationId = useAppStore((state) => state.setActiveConversationId);
  const setSelectedSkillId = useAppStore((state) => state.setSelectedSkillId);
  const setChatStatus = useAppStore((state) => state.setChatStatus);
  const setError = useAppStore((state) => state.setError);
  const setMobileSidebarOpen = useAppStore((state) => state.setMobileSidebarOpen);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const setConversations = useAppStore((state) => state.setConversations);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );
  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === selectedSkillId) ?? null,
    [selectedSkillId, skills],
  );

  const [draft, setDraft] = useState("");
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages.length, chatStatus]);

  async function handleSendMessage(messageOverride?: string) {
    if (!user) {
      return;
    }

    const sanitized = sanitizeInput(messageOverride ?? draft);
    if (!sanitized) {
      return;
    }

    const skill = selectedSkill ?? null;
    const userMessage = createMessage("user", sanitized, skill?.id ?? null);
    const conversation = activeConversation ?? buildConversation(sanitized);
    const conversationWithUserMessage = activeConversation
      ? withMessage(activeConversation, userMessage)
      : withMessage(conversation, userMessage);

    setError(null);
    setChatStatus("loading");
    setDraft("");
    upsertConversation(conversationWithUserMessage);
    setActiveConversationId(conversationWithUserMessage.id);

    try {
      await saveConversation(user.uid, conversationWithUserMessage);
      await updateMemoryProfile(
        user.uid,
        deriveMemory(sanitized, skill, language),
      );
      await trackAnalytics(user.uid, { messagesSent: 1, usageCount: 1 });

      const response = await postChatMessage({
        message: sanitized,
        conversationId: conversationWithUserMessage.id,
        language,
        skill,
        memory: deriveMemory(sanitized, skill, language),
      });

      const aiMessage = createMessage(
        "ai",
        normalizeWorkflowMessage(response.message),
        skill?.id ?? null,
        response.workflow,
      );
      const completedConversation = withMessage(conversationWithUserMessage, aiMessage);
      upsertConversation(completedConversation);

      await saveConversation(user.uid, completedConversation);
      await updateMemoryProfile(
        user.uid,
        deriveMemory(sanitized, skill, language, response.memoryHints),
      );
      await trackAnalytics(user.uid, {
        tasksCompleted: response.taskCompleted ? 1 : 0,
      });
      setChatStatus("idle");
    } catch {
      const failedMessage = createMessage(
        "ai",
        dictionary.workspace.error,
        skill?.id ?? null,
        [
          {
            id: "planning",
            label: "Planning",
            description: "Request received successfully.",
            status: "complete",
          },
          {
            id: "execution",
            label: "Execution",
            description: "Backend execution failed before a final answer was returned.",
            status: "error",
          },
          {
            id: "result",
            label: "Result",
            description: "No final result was produced.",
            status: "pending",
          },
        ],
      );

      const failedConversation = withMessage(conversationWithUserMessage, {
        ...failedMessage,
        error: true,
      });
      upsertConversation(failedConversation);
      await saveConversation(user.uid, failedConversation).catch(() => undefined);
      setError(dictionary.workspace.error);
      setChatStatus("error");
    }
  }

  async function handleVoiceInput() {
    if (!recognitionSupported) {
      setError(dictionary.system.voiceUnsupported);
      return;
    }

    try {
      const transcript = await listenOnce();
      setDraft((current) => [current, transcript].filter(Boolean).join(" ").trim());
    } catch {
      setError(dictionary.system.voiceUnsupported);
    }
  }

  async function handleCreateSkill(prompt: string) {
    if (!user) {
      return;
    }

    const sanitized = sanitizeInput(prompt);
    if (!sanitized) {
      return;
    }

    const skill: Skill = {
      id: getId(),
      title: createConversationTitle(sanitized),
      description: "Custom skill created from your prompt.",
      prompt: sanitized,
      createdAt: nowIso(),
      isSystem: false,
    };

    await saveSkill(user.uid, skill);
    setSelectedSkillId(skill.id);
    setError(dictionary.system.skillSaved);
  }

  async function handleRenameConversation(nextTitle: string) {
    if (!user || !renameTarget) {
      return;
    }

    const title = createConversationTitle(nextTitle);
    const nextConversation = { ...renameTarget, title, updatedAt: nowIso() };
    upsertConversation(nextConversation);
    await renameConversation(user.uid, renameTarget.id, title);
  }

  async function handleDeleteConversation() {
    if (!user || !deleteTarget) {
      return;
    }

    removeConversation(deleteTarget.id);
    await deleteConversation(user.uid, deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleClearHistory() {
    if (!user) {
      return;
    }

    await clearConversations(user.uid);
    setConversations([]);
    setSettingsOpen(false);
  }

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="app-shell min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1580px] gap-4 lg:min-h-[calc(100vh-3rem)] lg:gap-6">
        <Sidebar
          open={mobileSidebarOpen}
          conversations={conversations}
          activeConversationId={activeConversationId}
          skills={skills}
          selectedSkillId={selectedSkillId}
          onToggle={setMobileSidebarOpen}
          onNewChat={() => {
            setDraft("");
            setError(null);
            setActiveConversationId(null);
            setMobileSidebarOpen(false);
          }}
          onSelectConversation={(conversationId) => {
            startTransition(() => setActiveConversationId(conversationId));
            setMobileSidebarOpen(false);
          }}
          onRenameConversation={setRenameTarget}
          onDeleteConversation={setDeleteTarget}
          onSelectSkill={(skillId) => setSelectedSkillId(skillId)}
          onCreateSkill={() => setSkillModalOpen(true)}
        />

        <main className="flex min-w-0 flex-1 flex-col rounded-[32px]">
          <Topbar user={user} onOpenSettings={() => setSettingsOpen(true)} />

          <section className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <div className="scrollbar-subtle flex-1 space-y-6 overflow-y-auto px-1 py-8">
                {activeConversation?.messages.length ? (
                  activeConversation.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onSpeak={speak}
                    />
                  ))
                ) : (
                  <ChatEmptyState onPromptClick={(prompt) => void handleSendMessage(prompt)} />
                )}

                {chatStatus === "loading" ? (
                  <div className="flex justify-start">
                    <div className="surface-card rounded-[28px] px-5 py-4 text-sm text-muted">
                      {dictionary.workspace.thinking}
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-3xl bg-rose-500/10 px-5 py-4 text-sm text-rose-500">
                    {error}
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              <div className="mt-auto">
                {selectedSkill ? (
                  <div className="mx-auto mb-3 flex max-w-3xl items-center gap-2 px-2 text-sm text-muted">
                    <span className="rounded-full bg-surface px-3 py-2 shadow-soft">
                      {dictionary.chat.selectedSkill}: {selectedSkill.title}
                    </span>
                  </div>
                ) : null}
                <ChatInputBar
                  value={draft}
                  onChange={setDraft}
                  onSend={() => void handleSendMessage()}
                  onNewChat={() => {
                    setDraft("");
                    setActiveConversationId(null);
                  }}
                  onVoiceInput={() => void handleVoiceInput()}
                  loading={chatStatus === "loading"}
                  listening={isListening}
                />
              </div>
            </div>
          </section>
        </main>
      </div>

      <InputModal
        key={renameTarget?.id ?? "rename-modal"}
        open={Boolean(renameTarget)}
        title="Rename chat"
        description="Give this conversation a clearer title for your sidebar."
        placeholder="Enter a new title"
        confirmLabel="Save title"
        initialValue={renameTarget?.title ?? ""}
        onClose={() => setRenameTarget(null)}
        onConfirm={handleRenameConversation}
      />

      <InputModal
        key={skillModalOpen ? "skill-modal-open" : "skill-modal-closed"}
        open={skillModalOpen}
        title="Create a custom skill"
        description="Describe the behavior you want SOMA to reuse in future chats."
        placeholder="Example: Turn raw meeting notes into an action-first executive brief."
        confirmLabel="Save skill"
        onClose={() => setSkillModalOpen(false)}
        onConfirm={handleCreateSkill}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearHistory={handleClearHistory}
        onLogout={handleLogout}
      />

      <InputModal
        key={deleteTarget?.id ?? "delete-modal"}
        open={Boolean(deleteTarget)}
        title="Delete chat"
        description="Type DELETE to permanently remove this conversation."
        placeholder="DELETE"
        confirmLabel="Delete chat"
        initialValue=""
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (value) => {
          if (value !== "DELETE") {
            throw new Error("Type DELETE to confirm.");
          }
          await handleDeleteConversation();
        }}
      />
    </div>
  );
}

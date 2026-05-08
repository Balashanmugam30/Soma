"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { ChatMessage } from "@/components/chat/chat-message";
import { InputModal } from "@/components/common/input-modal";
import { Modal } from "@/components/common/modal";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SettingsModal } from "@/components/settings/settings-modal";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { useSpeech } from "@/hooks/use-speech";
import { DEFAULT_AGENTS, STORAGE_KEYS } from "@/lib/constants";
import {
  clearConversations,
  deleteConversation,
  renameConversation,
  saveConversation,
  trackAnalytics,
  updateMemoryProfile,
} from "@/lib/firestore";
import {
  buildConversation,
  createConversationTitle,
  createMessage,
  getId,
  nowIso,
  sanitizeInput,
  withMessage,
} from "@/lib/utils";
import { ApiError, postChatMessage } from "@/services/api";
import { useAppStore } from "@/store/app-store";
import type {
  AgentRuntime,
  AttachmentMeta,
  ChatRequestPayload,
  ChatResponse,
  Conversation,
  CustomAgent,
  MemoryProfile,
  Skill,
} from "@/types";

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
      skill ? `Favorite skill: ${skill.name || skill.title}` : "Favorite skill: General",
    ],
    repeatedPatterns: [...repeatedPatterns, ...memoryHints].slice(0, 6),
    usageHabits: [`Active hour: ${new Date().getHours()}:00`],
    lastSkillId: skill?.id ?? null,
    updatedAt: nowIso(),
  };
}

interface RetryContext {
  conversation: Conversation;
  payload: ChatRequestPayload;
  skill: Skill | null;
  agent: BuiltInAgentKey;
  scopeKey: string;
}

type BuiltInAgentKey = "office" | "student" | "life";

type AgentOption = {
  id: string;
  label: string;
  description: string;
  kind: "built-in" | "custom";
};

type ScheduledTask = {
  id: number;
  task: string;
  time: string;
  agent: string;
  status: string;
  user_email: string;
};

const AGENT_STORAGE_KEYS = {
  activeAgent: "soma-active-agent",
  conversationAgents: "soma-conversation-agents",
  activeConversationIds: "soma-active-conversation-ids",
  customAgents: "soma-custom-agents",
  pinnedCustomAgents: "soma-pinned-custom-agents",
  selectedCustomAgent: "soma-selected-custom-agent",
} as const;

const agentIdToKey: Record<"controller" | "planner" | "executor", BuiltInAgentKey> = {
  controller: "office",
  planner: "student",
  executor: "life",
};

const agentKeyToId: Record<BuiltInAgentKey, "controller" | "planner" | "executor"> = {
  office: "controller",
  student: "planner",
  life: "executor",
};

function cleanText(text: string) {
  return text
    .replace(/[#*`>-]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function readStoredAttachment(rawValue: string | null): AttachmentMeta | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as AttachmentMeta;
    if (typeof parsed.filename === "string" && typeof parsed.type === "string") {
      return parsed;
    }
  } catch (error) {
    console.error("[SOMA] Failed to parse stored attachment", error);
  }

  return null;
}

function buildDraftStorageKey(userId: string, conversationId: string | null) {
  return `${STORAGE_KEYS.draft}:${userId}:${conversationId ?? "new"}`;
}

function buildAttachmentStorageKey(userId: string, conversationId: string | null) {
  return `${STORAGE_KEYS.attachment}:${userId}:${conversationId ?? "new"}`;
}

function createSafeConversation(
  conversation: Conversation,
  userId: string,
): Conversation & { userId: string } {
  const fallbackTimestamp = nowIso();

  return {
    ...conversation,
    id: conversation.id || "",
    userId,
    title: conversation.title || "Untitled chat",
    createdAt: conversation.createdAt || fallbackTimestamp,
    updatedAt: conversation.updatedAt || fallbackTimestamp,
      messages: (conversation.messages ?? []).map((message) => ({
        ...message,
        id: message.id || getId(),
        content: message.content || "",
        timestamp: message.timestamp || fallbackTimestamp,
        workflow: message.workflow ?? [],
        steps: message.steps ?? [],
        skillId: message.skillId ?? null,
        attachments: message.attachments ?? [],
        error: Boolean(message.error),
      })),
  };
}

function resolveChatErrorMessage(
  error: unknown,
  fallbackMessage: string,
  dictionary: ReturnType<typeof useLanguage>["dictionary"],
) {
  if (error instanceof ApiError) {
    if (error.kind === "network") {
      return dictionary.system.networkIssue;
    }

    if (error.kind === "timeout") {
      return dictionary.system.timeoutIssue;
    }
  }

  return fallbackMessage || dictionary.system.genericIssue;
}

function WorkspaceShell() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { dictionary, language: currentLanguage } = useLanguage();
  const {
    isListening,
    isSpeaking,
    listenOnce,
    stopListening,
    stopSpeaking,
    speak,
    isProcessingVoice,
    recognitionSupported,
  } = useSpeech();

  const conversations = useAppStore((state) => state.conversations);
  const activeConversationId = useAppStore((state) => state.activeConversationId);
  const skills = useAppStore((state) => state.skills);
  const selectedSkillId = useAppStore((state) => state.selectedSkillId);
  const agents = useAppStore((state) => state.agents);
  const chatStatus = useAppStore((state) => state.chatStatus);
  const error = useAppStore((state) => state.error);
  const settingsOpen = useAppStore((state) => state.settingsOpen);
  const selectedAgentId = useAppStore((state) => state.selectedAgentId);
  const upsertConversation = useAppStore((state) => state.upsertConversation);
  const removeConversation = useAppStore((state) => state.removeConversation);
  const setActiveConversationId = useAppStore((state) => state.setActiveConversationId);
  const setSelectedSkillId = useAppStore((state) => state.setSelectedSkillId);
  const setActiveAgentId = useAppStore((state) => state.setActiveAgentId);
  const setSelectedAgentId = useAppStore((state) => state.setSelectedAgentId);
  const setAgents = useAppStore((state) => state.setAgents);
  const setChatStatus = useAppStore((state) => state.setChatStatus);
  const setError = useAppStore((state) => state.setError);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const setConversations = useAppStore((state) => state.setConversations);
  const setSkills = useAppStore((state) => state.setSkills);
  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === selectedSkillId) ?? null,
    [selectedSkillId, skills],
  );

  const [draft, setDraft] = useState("");
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameBuiltInAgentTarget, setRenameBuiltInAgentTarget] = useState<AgentRuntime | null>(null);
  const [renameCustomAgentTarget, setRenameCustomAgentTarget] = useState<CustomAgent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [customAgentModalOpen, setCustomAgentModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachment, setAttachment] = useState<AttachmentMeta | null>(null);
  const [retryContext, setRetryContext] = useState<RetryContext | null>(null);
  const [pinnedConversationIds, setPinnedConversationIds] = useState<string[]>([]);
  const [pinnedBuiltInAgentIds, setPinnedBuiltInAgentIds] = useState<string[]>([]);
  const [hiddenBuiltInAgentIds, setHiddenBuiltInAgentIds] = useState<string[]>([]);
  const [renamedBuiltInAgents, setRenamedBuiltInAgents] = useState<Record<string, string>>({});
  const [pinnedCustomAgentIds, setPinnedCustomAgentIds] = useState<string[]>([]);
  const [activeAgent, setActiveAgent] = useState<BuiltInAgentKey | null>("life");
  const [conversationAgents, setConversationAgents] = useState<Record<string, string>>({});
  const [activeConversationIds, setActiveConversationIds] = useState<Record<string, string | null>>({
    office: null,
    student: null,
    life: null,
  });
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [selectedCustomAgentId, setSelectedCustomAgentId] = useState<string | null>(null);
  const [customAgentName, setCustomAgentName] = useState("");
  const [customAgentDescription, setCustomAgentDescription] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const draftStateReadyRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const agentTimeoutsRef = useRef<number[]>([]);
  const hasRestoredSkillRef = useRef(false);
  const speechRequestRef = useRef(0);

  const resolvedActiveAgent = activeAgent ?? "life";
  const currentScopeKey = selectedCustomAgentId
    ? `custom:${selectedCustomAgentId}`
    : resolvedActiveAgent;
  const visibleConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) => (conversationAgents[conversation.id] ?? "life") === currentScopeKey,
      ),
    [conversationAgents, conversations, currentScopeKey],
  );
  const visibleBuiltInAgents = useMemo(() => {
    return agents
      .filter((agent) => !hiddenBuiltInAgentIds.includes(agent.id))
      .map((agent) => ({
        ...agent,
        name: renamedBuiltInAgents[agent.id] ?? agent.name,
      }))
      .sort((left, right) => {
        const leftPinned = pinnedBuiltInAgentIds.includes(left.id);
        const rightPinned = pinnedBuiltInAgentIds.includes(right.id);
        if (leftPinned === rightPinned) {
          return 0;
        }
        return leftPinned ? -1 : 1;
      });
  }, [agents, hiddenBuiltInAgentIds, pinnedBuiltInAgentIds, renamedBuiltInAgents]);
  const agentOptions = useMemo<AgentOption[]>(
    () => [
      ...visibleBuiltInAgents.map((agent) => ({
        id: agent.id,
        label: agent.name,
        description: agent.description,
        kind: "built-in" as const,
      })),
      ...customAgents.map((agent) => ({
        id: agent.id,
        label: agent.name,
        description: agent.description,
        kind: "custom" as const,
      })),
    ],
    [customAgents, visibleBuiltInAgents],
  );
  const visibleActiveConversationId = activeConversationIds[currentScopeKey] ?? null;
  const activeConversation = useMemo(
    () => {
      if (!visibleActiveConversationId) {
        return null;
      }

      return (
        visibleConversations.find((conversation) => conversation.id === visibleActiveConversationId) ??
        null
      );
    },
    [visibleActiveConversationId, visibleConversations],
  );
  const isEmpty = (activeConversation?.messages.length ?? 0) === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages.length, chatStatus]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const storageKey = `${STORAGE_KEYS.conversations}:${user.uid}`;
    const activeChatKey = `${STORAGE_KEYS.activeChat}:${user.uid}`;
    const storedConversations = window.localStorage.getItem(storageKey);
    const storedActiveChat = window.localStorage.getItem(activeChatKey);

    if (conversations.length === 0 && storedConversations) {
      try {
        const parsed = JSON.parse(storedConversations) as Conversation[];
        setConversations(parsed);
        if (storedActiveChat) {
          setActiveConversationId(storedActiveChat);
        }
      } catch (storageError) {
        console.error("[SOMA] Failed to restore conversations", storageError);
      }
    }
  }, [conversations.length, setActiveConversationId, setConversations, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const storedConversationAgents = window.localStorage.getItem(
      `${AGENT_STORAGE_KEYS.conversationAgents}:${user.uid}`,
    );
    const storedActiveConversationIds = window.localStorage.getItem(
      `${AGENT_STORAGE_KEYS.activeConversationIds}:${user.uid}`,
    );
    const storedActiveAgent = window.localStorage.getItem(
      `${AGENT_STORAGE_KEYS.activeAgent}:${user.uid}`,
    );
    const storedCustomAgents = window.localStorage.getItem(
      `${AGENT_STORAGE_KEYS.customAgents}:${user.uid}`,
    );
    const storedPinnedCustomAgents = window.localStorage.getItem(
      `${AGENT_STORAGE_KEYS.pinnedCustomAgents}:${user.uid}`,
    );
    const storedSelectedCustomAgent = window.localStorage.getItem(
      `${AGENT_STORAGE_KEYS.selectedCustomAgent}:${user.uid}`,
    );

    try {
      if (storedConversationAgents) {
        setConversationAgents(
          JSON.parse(storedConversationAgents) as Record<string, string>,
        );
      }
      if (storedActiveConversationIds) {
        setActiveConversationIds(
          JSON.parse(storedActiveConversationIds) as Record<string, string | null>,
        );
      }
      if (storedCustomAgents) {
        setCustomAgents(JSON.parse(storedCustomAgents) as CustomAgent[]);
      }
      if (storedPinnedCustomAgents) {
        setPinnedCustomAgentIds(JSON.parse(storedPinnedCustomAgents) as string[]);
      }

      if (storedSelectedCustomAgent) {
        setSelectedCustomAgentId(storedSelectedCustomAgent);
        setActiveAgent(null);
        setSelectedAgentId(null);
      } else if (
        storedActiveAgent &&
        ["office", "student", "life"].includes(storedActiveAgent)
      ) {
        const nextActiveAgent = storedActiveAgent as BuiltInAgentKey;
        setActiveAgent(nextActiveAgent);
        setSelectedAgentId(agentKeyToId[nextActiveAgent]);
      } else {
        setActiveAgent("life");
        setSelectedAgentId(agentKeyToId.life);
      }
    } catch (storageError) {
      console.error("[SOMA] Failed to restore agent workspace state", storageError);
    }
  }, [setSelectedAgentId, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const storageKey = `${STORAGE_KEYS.conversations}:${user.uid}`;
    const activeChatKey = `${STORAGE_KEYS.activeChat}:${user.uid}`;
    window.localStorage.setItem(storageKey, JSON.stringify(conversations));

    if (activeConversationId) {
      window.localStorage.setItem(activeChatKey, activeConversationId);
    } else {
      window.localStorage.removeItem(activeChatKey);
    }
  }, [activeConversationId, conversations, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    window.localStorage.setItem(
      `${AGENT_STORAGE_KEYS.conversationAgents}:${user.uid}`,
      JSON.stringify(conversationAgents),
    );
  }, [conversationAgents, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    window.localStorage.setItem(
      `${AGENT_STORAGE_KEYS.activeConversationIds}:${user.uid}`,
      JSON.stringify(activeConversationIds),
    );
  }, [activeConversationIds, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (activeAgent) {
      window.localStorage.setItem(`${AGENT_STORAGE_KEYS.activeAgent}:${user.uid}`, activeAgent);
      return;
    }

    window.localStorage.removeItem(`${AGENT_STORAGE_KEYS.activeAgent}:${user.uid}`);
  }, [activeAgent, user]);

  useEffect(() => {
    const selectedId = activeAgent ? agentKeyToId[activeAgent] : null;
    if (selectedAgentId !== selectedId) {
      setSelectedAgentId(selectedId);
    }
  }, [activeAgent, selectedAgentId, setSelectedAgentId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    window.localStorage.setItem(
      `${AGENT_STORAGE_KEYS.customAgents}:${user.uid}`,
      JSON.stringify(customAgents),
    );
  }, [customAgents, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    window.localStorage.setItem(
      `${AGENT_STORAGE_KEYS.pinnedCustomAgents}:${user.uid}`,
      JSON.stringify(pinnedCustomAgentIds),
    );
  }, [pinnedCustomAgentIds, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (selectedCustomAgentId) {
      window.localStorage.setItem(
        `${AGENT_STORAGE_KEYS.selectedCustomAgent}:${user.uid}`,
        selectedCustomAgentId,
      );
      return;
    }

    window.localStorage.removeItem(`${AGENT_STORAGE_KEYS.selectedCustomAgent}:${user.uid}`);
  }, [selectedCustomAgentId, user]);

  useEffect(() => {
    const requestedConversationId = activeConversationIds[currentScopeKey] ?? null;
    const hasVisibleRequestedConversation =
      requestedConversationId !== null &&
      visibleConversations.some((conversation) => conversation.id === requestedConversationId);
    const fallbackConversationId = visibleConversations[0]?.id ?? null;

    if (hasVisibleRequestedConversation || requestedConversationId === fallbackConversationId) {
      return;
    }

    setActiveConversationIds((current) => {
      const currentConversationId = current[currentScopeKey] ?? null;
      if (currentConversationId === fallbackConversationId) {
        return current;
      }

      return {
        ...current,
        [currentScopeKey]: fallbackConversationId,
      };
    });
  }, [activeConversationIds, currentScopeKey, visibleConversations]);

  useEffect(() => {
    if (activeConversationId === visibleActiveConversationId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setActiveConversationId(visibleActiveConversationId);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeConversationId, setActiveConversationId, visibleActiveConversationId]);

  const clearAgentSequence = useCallback(() => {
    agentTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    agentTimeoutsRef.current = [];
    setActiveAgentId(null);
    setAgents(DEFAULT_AGENTS);
  }, [setActiveAgentId, setAgents]);

  useEffect(() => () => clearAgentSequence(), [clearAgentSequence]);

  useEffect(() => {
    if (!user || skills.length === 0 || hasRestoredSkillRef.current) {
      return;
    }

    const storageKey = `${STORAGE_KEYS.selectedSkill}:${user.uid}`;
    const storedSkillId = window.localStorage.getItem(storageKey);

    if (
      storedSkillId &&
      skills.some((skill) => skill.id === storedSkillId)
    ) {
      setSelectedSkillId(storedSkillId);
    }

    hasRestoredSkillRef.current = true;
  }, [skills, user, setSelectedSkillId]);

  useEffect(() => {
    console.log("SelectedSkillId:", selectedSkillId);
  }, [selectedSkillId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const storageKey = `${STORAGE_KEYS.skills}:${user.uid}`;
    const storedSkills = window.localStorage.getItem(storageKey);

    if (!storedSkills || skills.length > 0) {
      return;
    }

    try {
      const parsed = JSON.parse(storedSkills) as Skill[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSkills(parsed);
      }
    } catch (storageError) {
      console.error("[SOMA] Failed to restore skills", storageError);
    }
  }, [setSkills, skills.length, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const storageKey = `${STORAGE_KEYS.skills}:${user.uid}`;
    window.localStorage.setItem(storageKey, JSON.stringify(skills));
  }, [skills, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const chatPins = window.localStorage.getItem(`${STORAGE_KEYS.activeChat}:pins:${user.uid}`);

    try {
      setPinnedConversationIds(chatPins ? (JSON.parse(chatPins) as string[]) : []);
    } catch (error) {
      console.error("[SOMA] Failed to restore pinned items", error);
      setPinnedConversationIds([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    window.localStorage.setItem(
      `${STORAGE_KEYS.activeChat}:pins:${user.uid}`,
      JSON.stringify(pinnedConversationIds),
    );
  }, [pinnedConversationIds, user]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/notifications");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { notifications?: string[] };
        setNotifications(data.notifications ?? []);
      } catch (notificationError) {
        console.error("[SOMA] Failed to fetch notifications", notificationError);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/tasks");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { tasks?: ScheduledTask[] };
        setTasks(data.tasks ?? []);
      } catch (taskError) {
        console.error("[SOMA] Failed to fetch tasks", taskError);
      }
    };

    void fetchTasks();
    const intervalId = window.setInterval(fetchTasks, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const storageKey = `${STORAGE_KEYS.selectedSkill}:${user.uid}`;

    if (selectedSkillId) {
      window.localStorage.setItem(storageKey, selectedSkillId);
      return;
    }

    window.localStorage.removeItem(storageKey);
  }, [selectedSkillId, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    draftStateReadyRef.current = false;
    const storedDraft = window.localStorage.getItem(
      buildDraftStorageKey(user.uid, visibleActiveConversationId),
    );
    const storedAttachment = readStoredAttachment(
      window.localStorage.getItem(
        buildAttachmentStorageKey(user.uid, visibleActiveConversationId),
      ),
    );
    const frameId = window.requestAnimationFrame(() => {
      setDraft(storedDraft ?? "");
      setAttachment(storedAttachment);
      draftStateReadyRef.current = true;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [user, visibleActiveConversationId]);

  useEffect(() => {
    if (!user || !draftStateReadyRef.current) {
      return;
    }

    const draftKey = buildDraftStorageKey(user.uid, visibleActiveConversationId);
    const attachmentKey = buildAttachmentStorageKey(user.uid, visibleActiveConversationId);
    const timeoutId = window.setTimeout(() => {
      if (draft.trim()) {
        window.localStorage.setItem(draftKey, draft);
      } else {
        window.localStorage.removeItem(draftKey);
      }

      if (attachment) {
        window.localStorage.setItem(attachmentKey, JSON.stringify(attachment));
      } else {
        window.localStorage.removeItem(attachmentKey);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [attachment, draft, user, visibleActiveConversationId]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileSelection(file: File | null) {
    if (!file) {
      return;
    }

    const isSupportedFile =
      file.type.startsWith("image/") ||
      file.type === "application/pdf" ||
      file.type.startsWith("text/") ||
      file.name.endsWith(".md");

    if (!isSupportedFile) {
      setError(dictionary.system.attachmentUnsupported);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(dictionary.system.attachmentTooLarge);
      return;
    }

    setAttachment({
      filename: file.name,
      type: file.type || "text/plain",
    });
    setError(null);
  }

  function handleSelectBuiltInAgent(agentId: "controller" | "planner" | "executor") {
    const nextAgent = agentIdToKey[agentId];
    if (activeAgent === nextAgent) {
      setActiveAgent(null);
      setSelectedAgentId(null);
      setSelectedCustomAgentId(null);
      setActiveConversationId(activeConversationIds.life ?? null);
      return;
    }

    setSelectedCustomAgentId(null);
    setActiveAgent(nextAgent);
    setSelectedAgentId(agentId);
    setActiveConversationId(activeConversationIds[nextAgent] ?? null);
  }

  function getSelectedBuiltInAgentType(): BuiltInAgentKey | null {
    if (selectedCustomAgentId) {
      return null;
    }

    return activeAgent ?? "life";
  }

  async function handleCopyMessage(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (copyError) {
      console.error("[SOMA] Failed to copy message", copyError);
      setError("Unable to copy this message right now.");
    }
  }

  async function handleSpeakMessage(message: Conversation["messages"][number]) {
    if (speakingMessageId === message.id && isSpeaking) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;
    setSpeakingMessageId(message.id);

    try {
      await speak(message.content, currentLanguage);
    } catch (speakError) {
      console.error("[SOMA] Failed to speak message", speakError);
      setError("Unable to play this message right now.");
    } finally {
      if (speechRequestRef.current === requestId) {
        setSpeakingMessageId(null);
      }
    }
  }

  function handleEditMessage(message: Conversation["messages"][number]) {
    setDraft(message.content);
    setAttachment(null);
    setError(null);
  }

  function handleCreateCustomAgent() {
    const name = sanitizeInput(customAgentName);
    const description = sanitizeInput(customAgentDescription);

    if (!name || !description) {
      setError("Agent name and description are required.");
      return;
    }

    const newAgent: CustomAgent = {
      id: getId(),
      name,
      description,
      createdAt: nowIso(),
    };

    setCustomAgents((current) => [newAgent, ...current]);
    setSelectedCustomAgentId(newAgent.id);
    setActiveConversationId(activeConversationIds[`custom:${newAgent.id}`] ?? null);
    setCustomAgentName("");
    setCustomAgentDescription("");
    setCustomAgentModalOpen(false);
    setError(null);
  }

  function handleSelectCustomAgent(agentId: string) {
    const nextSelectedAgentId = selectedCustomAgentId === agentId ? null : agentId;
    const nextScopeKey = nextSelectedAgentId ? `custom:${nextSelectedAgentId}` : "life";

    setSelectedCustomAgentId(nextSelectedAgentId);
    setActiveAgent(null);
    setSelectedAgentId(null);
    setActiveConversationId(activeConversationIds[nextScopeKey] ?? null);
  }

  function handleSelectAgentOption(option: AgentOption) {
    if (option.kind === "built-in") {
      handleSelectBuiltInAgent(option.id as "controller" | "planner" | "executor");
      return;
    }

    handleSelectCustomAgent(option.id);
  }

  function handlePinBuiltInAgent(agentId: AgentRuntime["id"]) {
    setPinnedBuiltInAgentIds((current) =>
      current.includes(agentId)
        ? current.filter((item) => item !== agentId)
        : [agentId, ...current],
    );
  }

  function handleDeleteBuiltInAgent(agentId: AgentRuntime["id"]) {
    const confirmDelete = window.confirm("Are you sure you want to delete this agent?");
    if (!confirmDelete) {
      return;
    }

    setHiddenBuiltInAgentIds((current) => [...current, agentId]);
    setPinnedBuiltInAgentIds((current) => current.filter((item) => item !== agentId));
    setRenamedBuiltInAgents((current) => {
      const next = { ...current };
      delete next[agentId];
      return next;
    });

    if (selectedAgentId === agentId) {
      setActiveAgent(null);
      setSelectedAgentId(null);
    }
  }

  async function handleRenameBuiltInAgent(nextTitle: string) {
    if (!renameBuiltInAgentTarget) {
      return;
    }

    const name = createConversationTitle(nextTitle);
    setRenamedBuiltInAgents((current) => ({
      ...current,
      [renameBuiltInAgentTarget.id]: name,
    }));
    setRenameBuiltInAgentTarget(null);
  }

  function handlePinCustomAgent(agentId: string) {
    setPinnedCustomAgentIds((current) =>
      current.includes(agentId)
        ? current.filter((item) => item !== agentId)
        : [agentId, ...current],
    );
  }

  async function handleRenameCustomAgent(nextTitle: string) {
    if (!renameCustomAgentTarget) {
      return;
    }

    const name = createConversationTitle(nextTitle);
    setCustomAgents((current) =>
      current.map((agent) =>
        agent.id === renameCustomAgentTarget.id
          ? {
              ...agent,
              name,
            }
          : agent,
      ),
    );
    setRenameCustomAgentTarget(null);
  }

  async function resolveAssistantReply(context: RetryContext) {
    if (!user) {
      return;
    }

    try {
      console.log("CALLING API NOW", context.payload);
      const result = (await postChatMessage(context.payload)) as ChatResponse;
      console.log("API SUCCESS", result);
      const normalizedResult = result as ChatResponse & {
        data?: { response?: string; steps?: ChatResponse["steps"] };
      };
      const aiText =
        normalizedResult.response ||
        normalizedResult.message ||
        normalizedResult.data?.response ||
        "No response from server";
      const aiMessage = createMessage(
        "ai",
        cleanText(aiText),
        context.skill?.id ?? null,
        [],
        normalizedResult.steps ?? normalizedResult.data?.steps ?? [],
      );
      const completedConversation = withMessage(context.conversation, aiMessage);
      upsertConversation(completedConversation);
      setConversationAgents((current) => ({
        ...current,
        [completedConversation.id]: context.scopeKey,
      }));
      setActiveConversationIds((current) => ({
        ...current,
        [context.scopeKey]: completedConversation.id,
      }));

      const safeConversation = createSafeConversation(completedConversation, user.uid);
        saveConversation(user.uid, safeConversation).catch((storageError) => {
          console.error("[SOMA] Failed to persist assistant message", storageError);
        });
        updateMemoryProfile(
          user.uid,
          deriveMemory(
            context.payload.message,
            context.skill,
            currentLanguage,
            normalizedResult.memoryHints,
          ),
        ).catch((memoryError) => {
          console.error("[SOMA] Failed to update assistant memory", memoryError);
        });
        trackAnalytics(user.uid, {
          tasksCompleted: normalizedResult.taskCompleted ? 1 : 0,
        }).catch((analyticsError) => {
          console.error("[SOMA] Failed to track assistant analytics", analyticsError);
        });

      const usedFallbackResponse =
        aiText === dictionary.system.timeoutIssue ||
        aiText === dictionary.system.genericIssue;

      setRetryContext(usedFallbackResponse ? context : null);
      setAttachment(null);
      setError(usedFallbackResponse ? aiText : null);
      return;
    } catch (error) {
      console.error("API ERROR", error);
      const failedMessage = createMessage(
        "ai",
        resolveChatErrorMessage(error, dictionary.workspace.error, dictionary),
        context.skill?.id ?? null,
        [],
        [],
      );

      const failedConversation = withMessage(context.conversation, {
        ...failedMessage,
        error: true,
      });
      upsertConversation(failedConversation);
      setConversationAgents((current) => ({
        ...current,
        [failedConversation.id]: context.scopeKey,
      }));
      setActiveConversationIds((current) => ({
        ...current,
        [context.scopeKey]: failedConversation.id,
      }));
      const safeConversation = createSafeConversation(failedConversation, user.uid);
      await saveConversation(user.uid, safeConversation).catch(() => undefined);
      setRetryContext(context);
      setError(resolveChatErrorMessage(error, dictionary.workspace.error, dictionary));
      return;
    } finally {
      setChatStatus("idle");
      clearAgentSequence();
    }
  }

  async function handleSendMessage(messageOverride?: string) {
    console.log("HANDLE SEND CALLED", {
      messageOverride,
      chatStatus,
      activeConversationId: visibleActiveConversationId,
    });

    if (!user) {
      return;
    }

    if (chatStatus === "loading") {
      console.warn("[SOMA] chatStatus was still loading; continuing with a fresh request");
    }

    const sanitized = sanitizeInput(messageOverride ?? draft);
    if (!sanitized) {
      return;
    }

    const skill = selectedSkill ?? null;
    const context = {
      conversation: activeConversation ?? buildConversation(sanitized),
      skill,
    };
    const userMessage = createMessage(
      "user",
      sanitized,
      context.skill?.id ?? null,
      undefined,
      undefined,
      attachment ? [attachment] : undefined,
    );
    const updatedConversation = withMessage(context.conversation, userMessage);
    const safeConversation = createSafeConversation(updatedConversation, user.uid);

    setError(null);
    setRetryContext(null);
    setChatStatus("loading");
    setDraft("");
    upsertConversation(updatedConversation);
    setActiveConversationId(updatedConversation.id);
    setConversationAgents((current) => ({
      ...current,
      [updatedConversation.id]: currentScopeKey,
    }));
    setActiveConversationIds((current) => ({
      ...current,
      [currentScopeKey]: updatedConversation.id,
    }));

    saveConversation(user.uid, safeConversation).catch((storageError) => {
      console.error("[SOMA] Failed to persist user message", storageError);
    });
    updateMemoryProfile(
      user.uid,
      deriveMemory(sanitized, skill, currentLanguage),
    ).catch((memoryError) => {
      console.error("[SOMA] Failed to update memory profile", memoryError);
    });
    trackAnalytics(user.uid, { messagesSent: 1, usageCount: 1 }).catch((analyticsError) => {
      console.error("[SOMA] Failed to track message analytics", analyticsError);
    });

    const nextRetryContext: RetryContext = {
      conversation: updatedConversation,
      payload: {
        userId: user.uid,
        userEmail: user.email ?? null,
        chatId: updatedConversation.id,
        message: sanitized,
        language: currentLanguage,
        agentType: getSelectedBuiltInAgentType(),
        skill,
        skillId: skill?.id ?? null,
        files: attachment ? [attachment] : [],
      },
      skill,
      agent: resolvedActiveAgent,
      scopeKey: currentScopeKey,
    };

    console.log("CALLING API NOW", nextRetryContext.payload);
    await resolveAssistantReply(nextRetryContext);
  }

  async function handleVoiceInput() {
    if (!recognitionSupported) {
      setError(dictionary.system.voiceUnsupported);
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      const transcript = await listenOnce(currentLanguage);
      setDraft((current) => [current, transcript].filter(Boolean).join(" ").trim());
    } catch {
      setError(dictionary.system.voiceUnsupported);
    }
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
    setConversationAgents((current) => {
      const next = { ...current };
      delete next[deleteTarget.id];
      return next;
    });
    setActiveConversationIds((current) => {
      const next = { ...current };
      const scopeKey = conversationAgents[deleteTarget.id] ?? "life";
      if (next[scopeKey] === deleteTarget.id) {
        next[scopeKey] = null;
      }
      return next;
    });
    await deleteConversation(user.uid, deleteTarget.id);
    setDeleteTarget(null);
  }

  function togglePinnedConversation(conversationId: string) {
    setPinnedConversationIds((current) =>
      current.includes(conversationId)
        ? current.filter((item) => item !== conversationId)
        : [conversationId, ...current],
    );
  }

  async function handleClearHistory() {
    if (!user) {
      return;
    }

    await clearConversations(user.uid);
    setConversations([]);
    setConversationAgents({});
    setActiveConversationIds({
      office: null,
      student: null,
      life: null,
    });
    setSettingsOpen(false);
  }

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  async function handleRetryLastRequest() {
    if (!retryContext) {
      return;
    }

    setError(null);
    setChatStatus("loading");
    await resolveAssistantReply(retryContext);
  }

  if (loading) {
    return (
      <div className="app-shell min-h-screen p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1580px] items-center justify-center rounded-[32px] surface-card px-6 py-12 text-center text-muted lg:min-h-[calc(100vh-3rem)]">
          {dictionary.system.loadingWorkspace}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell min-h-screen p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1580px] items-center justify-center rounded-[32px] surface-card px-6 py-12 text-center text-muted lg:min-h-[calc(100vh-3rem)]">
          Loading user...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      <div className="fixed right-4 top-4 z-50">
        {notifications.map((notification, index) => (
          <div
            key={`${notification}-${index}`}
            className="mb-2 rounded-xl bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] shadow-soft"
          >
            {notification}
          </div>
        ))}
      </div>
      <div className="fixed bottom-28 right-4 z-40 w-56 max-h-56 overflow-hidden rounded-2xl bg-[var(--bg-secondary)] px-3 py-2.5 text-[var(--text-main)] shadow-soft md:bottom-32">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-xs opacity-60">No tasks</p>
        ) : (
          <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div key={task.id} className="border-b border-white/10 py-1.5 text-xs last:border-b-0">
                <div className="truncate font-medium">{task.task}</div>
                <div className="mt-1 opacity-70">{new Date(task.time).toLocaleString()}</div>
                <div className="mt-0.5 opacity-60">Status: {task.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className={`h-full flex-shrink-0 bg-[var(--bg-sidebar)] transition-all duration-300 ${
          isSidebarOpen ? "w-[280px]" : "w-[80px]"
        } flex flex-col`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          toggle={() => setIsSidebarOpen(!isSidebarOpen)}
          agents={visibleBuiltInAgents}
          selectedAgentId={selectedAgentId}
          conversations={visibleConversations}
          activeConversationId={visibleActiveConversationId}
          customAgents={customAgents}
          pinnedConversationIds={pinnedConversationIds}
          pinnedCustomAgentIds={pinnedCustomAgentIds}
          selectedCustomAgentId={selectedCustomAgentId}
          onNewChat={() => {
            setDraft("");
            setAttachment(null);
            setError(null);
            setRetryContext(null);
            setActiveConversationIds((current) => ({
              ...current,
              [currentScopeKey]: null,
            }));
            setActiveConversationId(null);
          }}
          onSelectConversation={(conversationId) => {
            setActiveConversationIds((current) => ({
              ...current,
              [currentScopeKey]: conversationId,
            }));
            setActiveConversationId(conversationId);
          }}
          onSelectAgent={handleSelectBuiltInAgent}
          onRenameAgent={setRenameBuiltInAgentTarget}
          onPinAgent={handlePinBuiltInAgent}
          onDeleteAgent={handleDeleteBuiltInAgent}
          onRenameConversation={setRenameTarget}
          onDeleteConversation={setDeleteTarget}
          onPinConversation={togglePinnedConversation}
          onCreateAgent={() => setCustomAgentModalOpen(true)}
          onSelectCustomAgent={handleSelectCustomAgent}
          onRenameCustomAgent={setRenameCustomAgentTarget}
          onPinCustomAgent={handlePinCustomAgent}
          onDeleteCustomAgent={(agentId) => {
            const confirmDelete = window.confirm("Are you sure you want to delete this agent?");
            if (confirmDelete) {
              setCustomAgents((current) => current.filter((agent) => agent.id !== agentId));
              setPinnedCustomAgentIds((current) => current.filter((item) => item !== agentId));
              setSelectedCustomAgentId((current) => (current === agentId ? null : current));
            }
          }}
        />
      </div>

      <main className="flex flex-1 h-full flex-col overflow-hidden bg-[var(--bg-primary)]">
        <div className="h-14 flex items-center justify-between bg-[var(--bg-primary)] px-6">
          <div className="text-2xl font-bold tracking-wide text-[var(--text-main)]">
            Soma
          </div>
          <Topbar user={user} onOpenSettings={() => setSettingsOpen(true)} />
        </div>

        <div className="scrollbar-subtle flex-1 overflow-y-auto px-6 py-4">
          <div className={isEmpty ? "flex h-full flex-col items-center justify-center" : "mx-auto flex min-h-full w-full max-w-3xl flex-col"}>
            {isEmpty ? (
              <div className="w-full max-w-2xl flex flex-col items-center">

                <h2 className="mb-2 text-xl text-[var(--text-main)]/60">
                  Hi {user?.displayName || "User"}
                </h2>

                <h1 className="mb-6 text-4xl font-semibold text-[var(--text-main)]">
                  Where should we start?
                </h1>

                <div className="w-full">
                  <ChatInputBar
                    value={draft}
                    onChange={setDraft}
                    onSend={handleSendMessage}
                    skills={skills}
                    agentOptions={agentOptions}
                    onSelectAgentOption={handleSelectAgentOption}
                    onSelectSkill={setSelectedSkillId}
                    onAttach={openFilePicker}
                    onClearAttachment={() => setAttachment(null)}
                    onVoiceInput={() => void handleVoiceInput()}
                    loading={chatStatus === "loading"}
                    listening={isListening}
                    processingVoice={isProcessingVoice}
                    attachmentName={attachment?.filename ?? null}
                  />
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {[
                    "Plan my day",
                    "Create a study schedule",
                    "Organize my tasks",
                    "Summarize content",
                    "Improve my resume",
                    "Prepare for interview",
                  ].map((item) => (
                    <button
                      key={item}
                      className="rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-main)] opacity-80 hover:opacity-100"
                      onClick={() => setDraft(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              <div className="flex h-full w-full flex-col justify-end px-4">
                <div className="space-y-6">
                  {activeConversation?.messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onSpeak={handleSpeakMessage}
                      onCopy={handleCopyMessage}
                      onEdit={handleEditMessage}
                      isSpeaking={speakingMessageId === message.id && isSpeaking}
                      animate={
                        message.role === "ai" &&
                        index === activeConversation.messages.length - 1 &&
                        !message.error
                      }
                    />
                  ))}

                  {chatStatus === "loading" ? (
                    <div className="flex items-center gap-1 px-2 py-2">
                      <div className="h-2 w-2 rounded-full bg-white animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
                      <div className="h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-3xl bg-rose-500/10 px-5 py-4 text-sm text-rose-500" aria-live="polite">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>{error}</span>
                        {retryContext ? (
                          <button
                            type="button"
                            onClick={() => void handleRetryLastRequest()}
                            className="rounded-full bg-rose-500/12 px-4 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-500/18"
                          >
                            {dictionary.common.retry}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

        {!isEmpty ? (
        <div className="sticky bottom-0 bg-[var(--bg-primary)] px-4 py-3">
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            <ChatInputBar
              value={draft}
              onChange={setDraft}
              onSend={handleSendMessage}
              skills={skills}
              agentOptions={agentOptions}
              onSelectAgentOption={handleSelectAgentOption}
              onSelectSkill={setSelectedSkillId}
              onAttach={openFilePicker}
              onClearAttachment={() => setAttachment(null)}
              onVoiceInput={() => void handleVoiceInput()}
              loading={chatStatus === "loading"}
              listening={isListening}
              processingVoice={isProcessingVoice}
              attachmentName={attachment?.filename ?? null}
            />
          </div>
        </div>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*,.txt,.md"
          className="hidden"
          onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
        />
      </main>

      <InputModal
        key={renameTarget?.id ?? "rename-modal"}
        open={Boolean(renameTarget)}
        title={dictionary.modals.renameChatTitle}
        description={dictionary.modals.renameChatDescription}
        placeholder={dictionary.modals.renameChatPlaceholder}
        confirmLabel={dictionary.modals.saveTitle}
        initialValue={renameTarget?.title ?? ""}
        onClose={() => setRenameTarget(null)}
        onConfirm={handleRenameConversation}
      />

      <InputModal
        key={renameBuiltInAgentTarget?.id ?? "rename-built-in-agent-modal"}
        open={Boolean(renameBuiltInAgentTarget)}
        title="Rename agent"
        description="Give this agent a clearer name."
        placeholder="Agent name"
        confirmLabel={dictionary.modals.saveTitle}
        initialValue={renameBuiltInAgentTarget?.name ?? ""}
        onClose={() => setRenameBuiltInAgentTarget(null)}
        onConfirm={handleRenameBuiltInAgent}
      />

      <InputModal
        key={renameCustomAgentTarget?.id ?? "rename-custom-agent-modal"}
        open={Boolean(renameCustomAgentTarget)}
        title="Rename agent"
        description="Give this custom agent a clearer name."
        placeholder="Agent name"
        confirmLabel={dictionary.modals.saveTitle}
        initialValue={renameCustomAgentTarget?.name ?? ""}
        onClose={() => setRenameCustomAgentTarget(null)}
        onConfirm={handleRenameCustomAgent}
      />

      <Modal
        open={customAgentModalOpen}
        title="Create a Custom Agent"
        description="Build your own agent for your personal needs."
        onClose={() => {
          setCustomAgentModalOpen(false);
          setCustomAgentName("");
          setCustomAgentDescription("");
        }}
      >
        <div className="space-y-4">
          <input
            value={customAgentName}
            onChange={(event) => setCustomAgentName(event.target.value)}
            placeholder="Agent name"
            className="w-full rounded-2xl bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none"
          />
          <textarea
            value={customAgentDescription}
            onChange={(event) => setCustomAgentDescription(event.target.value)}
            placeholder="Agent description"
            rows={4}
            className="w-full rounded-2xl bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setCustomAgentModalOpen(false);
                setCustomAgentName("");
                setCustomAgentDescription("");
              }}
              className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:bg-hover hover:text-foreground"
            >
              {dictionary.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleCreateCustomAgent}
              className="rounded-full bg-[var(--bg-secondary)] px-5 py-2.5 text-sm font-medium text-[var(--text-main)] transition hover:opacity-90"
            >
              Create Agent
            </button>
          </div>
        </div>
      </Modal>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearHistory={handleClearHistory}
        onLogout={handleLogout}
      />

      <Modal
        open={Boolean(deleteTarget)}
        title={dictionary.modals.deleteChatTitle}
        description="Are you sure you want to delete this chat?"
        onClose={() => setDeleteTarget(null)}
      >
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:bg-hover hover:text-foreground"
          >
            {dictionary.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteConversation()}
            className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </Modal>

    </div>
  );
}

export { WorkspaceShell };

export default WorkspaceShell;

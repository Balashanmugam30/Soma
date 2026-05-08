"use client";

import { create } from "zustand";
import { DEFAULT_AGENTS } from "@/lib/constants";
import { normalizeSkillRecord } from "@/lib/utils";
import type {
  AgentId,
  AgentRuntime,
  Conversation,
  Language,
  Skill,
  UserProfile,
} from "@/types";

type ChatStatus = "idle" | "loading" | "error";

interface AppState {
  userProfile: UserProfile | null;
  language: Language;
  conversations: Conversation[];
  activeConversationId: string | null;
  skills: Skill[];
  selectedSkillId: string | null;
  agents: AgentRuntime[];
  activeAgentId: AgentId | null;
  selectedAgentId: AgentId | null;
  chatStatus: ChatStatus;
  error: string | null;
  mobileSidebarOpen: boolean;
  settingsOpen: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  setLanguage: (language: Language) => void;
  setConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  setActiveConversationId: (conversationId: string | null) => void;
  setSkills: (skills: Skill[]) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (skillId: string) => void;
  upsertSkill: (skill: Skill) => void;
  setSelectedSkillId: (skillId: string | null) => void;
  setAgents: (agents: AgentRuntime[]) => void;
  setActiveAgentId: (agentId: AgentId | null) => void;
  setSelectedAgentId: (agentId: AgentId | null) => void;
  setChatStatus: (status: ChatStatus) => void;
  setError: (error: string | null) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  resetWorkspace: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userProfile: null,
  language: "en",
  conversations: [],
  activeConversationId: null,
  skills: [],
  selectedSkillId: "study-planner",
  agents: DEFAULT_AGENTS,
  activeAgentId: null,
  selectedAgentId: null,
  chatStatus: "idle",
  error: null,
  mobileSidebarOpen: false,
  settingsOpen: false,
  setUserProfile: (userProfile) => set({ userProfile }),
  setLanguage: (language) => set({ language }),
  setConversations: (conversations) =>
    set((state) => {
      const activeConversationExists = conversations.some(
        (item) => item.id === state.activeConversationId,
      );

      return {
        conversations,
        activeConversationId:
          activeConversationExists || conversations.length === 0
            ? state.activeConversationId
            : conversations[0]?.id ?? null,
      };
    }),
  upsertConversation: (conversation) =>
    set((state) => {
      const conversations = [...state.conversations];
      const existingIndex = conversations.findIndex((item) => item.id === conversation.id);

      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation);
      }

      conversations.sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );

      return {
        conversations,
        activeConversationId: state.activeConversationId ?? conversation.id,
      };
    }),
  removeConversation: (conversationId) =>
    set((state) => {
      const conversations = state.conversations.filter((item) => item.id !== conversationId);
      return {
        conversations,
        activeConversationId:
          state.activeConversationId === conversationId
            ? conversations[0]?.id ?? null
            : state.activeConversationId,
      };
    }),
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setSkills: (skills) =>
    set((state) => {
      const normalizedSkills = skills.map(normalizeSkillRecord);
      return {
        skills: normalizedSkills,
        selectedSkillId:
          normalizedSkills.some((skill) => skill.id === state.selectedSkillId)
            ? state.selectedSkillId
            : normalizedSkills[0]?.id ?? null,
      };
    }),
  addSkill: (skill) =>
    set((state) => ({
      skills: [...state.skills, normalizeSkillRecord(skill)],
    })),
  removeSkill: (skillId) =>
    set((state) => {
      const skills = state.skills.filter((skill) => skill.id !== skillId);
      return {
        skills,
        selectedSkillId:
          state.selectedSkillId === skillId ? skills[0]?.id ?? null : state.selectedSkillId,
      };
    }),
  upsertSkill: (skill) =>
    set((state) => {
      const nextSkills = [...state.skills];
      const existingIndex = nextSkills.findIndex((item) => item.id === skill.id);

      if (existingIndex >= 0) {
        nextSkills[existingIndex] = normalizeSkillRecord(skill);
      } else {
        nextSkills.push(normalizeSkillRecord(skill));
      }

      nextSkills.sort((left, right) =>
        String(left.createdAt ?? 0).localeCompare(String(right.createdAt ?? 0)),
      );

      return {
        skills: nextSkills,
        selectedSkillId: state.selectedSkillId ?? skill.id,
      };
    }),
  setSelectedSkillId: (selectedSkillId) =>
    set((state) => {
      if (state.selectedSkillId === selectedSkillId) {
        return state;
      }

      return { selectedSkillId };
    }),
  setAgents: (agents) => set({ agents }),
  setActiveAgentId: (activeAgentId) =>
    set((state) => ({
      activeAgentId,
      agents: state.agents.map((agent) => ({
        ...agent,
        status: agent.id === activeAgentId ? "active" : "idle",
      })),
    })),
  setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
  setChatStatus: (chatStatus) => set({ chatStatus }),
  setError: (error) => set({ error }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  resetWorkspace: () =>
    set({
      conversations: [],
      activeConversationId: null,
      skills: [],
      selectedSkillId: "study-planner",
      agents: DEFAULT_AGENTS,
      activeAgentId: null,
      selectedAgentId: null,
      chatStatus: "idle",
      error: null,
      mobileSidebarOpen: false,
      settingsOpen: false,
    }),
}));

export function getActiveConversation() {
  const state = useAppStore.getState();
  return state.conversations.find((item) => item.id === state.activeConversationId) ?? null;
}

"use client";

import { create } from "zustand";
import type { Conversation, Language, Skill, UserProfile } from "@/types";

type ChatStatus = "idle" | "loading" | "error";

interface AppState {
  userProfile: UserProfile | null;
  language: Language;
  conversations: Conversation[];
  activeConversationId: string | null;
  skills: Skill[];
  selectedSkillId: string | null;
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
  setSelectedSkillId: (skillId: string | null) => void;
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
  selectedSkillId: "planner",
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
    set((state) => ({
      skills,
      selectedSkillId:
        skills.some((skill) => skill.id === state.selectedSkillId)
          ? state.selectedSkillId
          : skills[0]?.id ?? null,
    })),
  setSelectedSkillId: (selectedSkillId) => set({ selectedSkillId }),
  setChatStatus: (chatStatus) => set({ chatStatus }),
  setError: (error) => set({ error }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  resetWorkspace: () =>
    set({
      conversations: [],
      activeConversationId: null,
      skills: [],
      selectedSkillId: "planner",
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

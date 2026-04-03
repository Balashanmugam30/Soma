"use client";

import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { DEFAULT_SKILLS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { nowIso } from "@/lib/utils";
import type {
  Conversation,
  Language,
  MemoryProfile,
  Skill,
  ThemeMode,
  UserAnalytics,
  UserProfile,
} from "@/types";

function ensureDb() {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return db;
}

function userRef(userId: string) {
  return doc(ensureDb(), "users", userId);
}

function conversationCollection(userId: string) {
  return collection(userRef(userId), "conversations");
}

function skillCollection(userId: string) {
  return collection(userRef(userId), "skills");
}

function memoryRef(userId: string) {
  return doc(userRef(userId), "memory", "profile");
}

function analyticsRef(userId: string) {
  return doc(userRef(userId), "analytics", "summary");
}

function normalizeConversation(
  id: string,
  data: Record<string, unknown>,
): Conversation {
  return {
    id,
    title: String(data.title ?? "Untitled chat"),
    createdAt: String(data.createdAt ?? nowIso()),
    updatedAt: String(data.updatedAt ?? nowIso()),
    messages: Array.isArray(data.messages) ? (data.messages as Conversation["messages"]) : [],
  };
}

function normalizeSkill(id: string, data: Record<string, unknown>): Skill {
  return {
    id,
    title: String(data.title ?? "Untitled skill"),
    description: String(data.description ?? ""),
    prompt: String(data.prompt ?? ""),
    createdAt: String(data.createdAt ?? nowIso()),
    isSystem: Boolean(data.isSystem),
  };
}

export async function upsertUserProfile(
  user: User,
  overrides?: Partial<Pick<UserProfile, "preferredLanguage" | "themePreference">>,
) {
  const timestamp = nowIso();
  const profile: UserProfile = {
    id: user.uid,
    name: user.displayName ?? "SOMA User",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
    preferredLanguage: overrides?.preferredLanguage ?? "en",
    languageSelected: false,
    themePreference: overrides?.themePreference ?? "system",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setDoc(userRef(user.uid), profile, { merge: true });
}

export function listenToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void,
) {
  return onSnapshot(userRef(userId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback(snapshot.data() as UserProfile);
  });
}

export function listenToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
) {
  const conversationsQuery = query(
    conversationCollection(userId),
    orderBy("updatedAt", "desc"),
  );

  return onSnapshot(conversationsQuery, (snapshot) => {
    const conversations = snapshot.docs.map((item) =>
      normalizeConversation(item.id, item.data()),
    );
    callback(conversations);
  });
}

export function listenToSkills(userId: string, callback: (skills: Skill[]) => void) {
  const skillsQuery = query(skillCollection(userId), orderBy("createdAt", "asc"));
  return onSnapshot(skillsQuery, (snapshot) => {
    const skills = snapshot.docs.map((item) => normalizeSkill(item.id, item.data()));
    callback(skills);
  });
}

export async function saveConversation(userId: string, conversation: Conversation) {
  await setDoc(doc(conversationCollection(userId), conversation.id), conversation, {
    merge: true,
  });
}

export async function renameConversation(
  userId: string,
  conversationId: string,
  title: string,
) {
  await setDoc(
    doc(conversationCollection(userId), conversationId),
    { title, updatedAt: nowIso() },
    { merge: true },
  );
}

export async function deleteConversation(userId: string, conversationId: string) {
  await deleteDoc(doc(conversationCollection(userId), conversationId));
}

export async function clearConversations(userId: string) {
  const snapshot = await getDocs(conversationCollection(userId));
  const batch = writeBatch(ensureDb());
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
}

export async function ensureDefaultSkills(userId: string) {
  const batch = writeBatch(ensureDb());
  DEFAULT_SKILLS.forEach((skill) => {
    batch.set(doc(skillCollection(userId), skill.id), skill, { merge: true });
  });
  await batch.commit();
}

export async function saveSkill(userId: string, skill: Skill) {
  await setDoc(doc(skillCollection(userId), skill.id), skill, { merge: true });
}

export async function saveLanguagePreference(userId: string, language: Language) {
  await setDoc(
    userRef(userId),
    { preferredLanguage: language, languageSelected: true, updatedAt: nowIso() },
    { merge: true },
  );
}

export async function saveThemePreference(userId: string, theme: ThemeMode) {
  await setDoc(
    userRef(userId),
    { themePreference: theme, updatedAt: nowIso() },
    { merge: true },
  );
}

export async function updateMemoryProfile(
  userId: string,
  partial: Partial<MemoryProfile>,
) {
  await setDoc(
    memoryRef(userId),
    {
      preferences: partial.preferences ?? [],
      repeatedPatterns: partial.repeatedPatterns ?? [],
      usageHabits: partial.usageHabits ?? [],
      lastSkillId: partial.lastSkillId ?? null,
      updatedAt: nowIso(),
    },
    { merge: true },
  );
}

export async function trackAnalytics(
  userId: string,
  updates: Partial<UserAnalytics> & {
    messagesSent?: number;
    tasksCompleted?: number;
    usageCount?: number;
  },
) {
  await setDoc(
    analyticsRef(userId),
    {
      messagesSent: increment(updates.messagesSent ?? 0),
      tasksCompleted: increment(updates.tasksCompleted ?? 0),
      usageCount: increment(updates.usageCount ?? 0),
      lastActiveAt: nowIso(),
    },
    { merge: true },
  );
}

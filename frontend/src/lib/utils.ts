import type { ChatMessage, Conversation, MessageRole, Skill } from "@/types";
import { createDefaultWorkflowSteps } from "@/lib/constants";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function nowIso() {
  return new Date().toISOString();
}

export function getId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
}

export function sanitizeInput(input: string) {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

export function createConversationTitle(input: string) {
  const sanitized = sanitizeInput(input);
  if (!sanitized) {
    return "Untitled chat";
  }

  return sanitized.length > 42 ? `${sanitized.slice(0, 42).trim()}...` : sanitized;
}

export function createMessage(
  role: MessageRole,
  content: string,
  skillId?: string | null,
  workflow = role === "ai" ? createDefaultWorkflowSteps() : undefined,
): ChatMessage {
  return {
    id: getId(),
    role,
    content,
    timestamp: nowIso(),
    skillId: skillId ?? null,
    workflow,
  };
}

export function buildConversation(
  input: string,
  initialMessage?: ChatMessage,
): Conversation {
  const timestamp = nowIso();
  return {
    id: getId(),
    title: createConversationTitle(input),
    createdAt: timestamp,
    updatedAt: initialMessage?.timestamp ?? timestamp,
    messages: initialMessage ? [initialMessage] : [],
  };
}

export function withMessage(
  conversation: Conversation,
  message: ChatMessage,
): Conversation {
  const title =
    conversation.messages.length === 0 && message.role === "user"
      ? createConversationTitle(message.content)
      : conversation.title;

  return {
    ...conversation,
    title,
    updatedAt: message.timestamp,
    messages: [...conversation.messages, message],
  };
}

export function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatDateLabel(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function extractSkillPreview(skill: Skill) {
  return skill.prompt.length > 120
    ? `${skill.prompt.slice(0, 120).trim()}...`
    : skill.prompt;
}

export function normalizeWorkflowMessage(content: string) {
  return content.trim() || "I have the result ready.";
}

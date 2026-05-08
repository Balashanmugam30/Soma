import type {
  AgentId,
  AttachmentMeta,
  ChatMessage,
  Conversation,
  MessageRole,
  Skill,
  ThinkingStep,
} from "@/types";
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
  steps?: ThinkingStep[],
  attachments?: AttachmentMeta[],
): ChatMessage {
  return {
    id: getId(),
    role,
    content,
    timestamp: nowIso(),
    skillId: skillId ?? null,
    workflow,
    steps,
    attachments,
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
  const previewSource = skill.content || skill.prompt || "";
  return previewSource.length > 120
    ? `${previewSource.slice(0, 120).trim()}...`
    : previewSource;
}

export function normalizeWorkflowMessage(content: string) {
  return content.trim() || "I have the result ready.";
}

export function inferSkillCategory(skill: Pick<Skill, "id" | "title" | "description" | "prompt">): AgentId {
  const signature = `${skill.id} ${skill.title} ${skill.description} ${skill.prompt}`.toLowerCase();

  if (
    signature.includes("task") ||
    signature.includes("workflow") ||
    signature.includes("command") ||
    signature.includes("reminder")
  ) {
    return "controller";
  }

  if (
    signature.includes("research") ||
    signature.includes("summary") ||
    signature.includes("summar") ||
    signature.includes("analysis") ||
    signature.includes("insight")
  ) {
    return "executor";
  }

  return "planner";
}

export function normalizeSkillRecord(skill: Skill): Skill {
  const title = skill.title?.trim() || skill.name?.trim() || "Untitled skill";
  const prompt = skill.prompt?.trim() || skill.content?.trim() || "";
  const description = skill.description?.trim() || prompt || "Custom skill";

  return {
    ...skill,
    title,
    name: skill.name?.trim() || title,
    description,
    prompt,
    content: skill.content?.trim() || prompt,
    category: skill.category ?? inferSkillCategory({
      id: skill.id,
      title,
      description,
      prompt,
    }),
  };
}

export function getSkillDisplayName(skill: Skill) {
  return skill.name?.trim() || skill.title || "Untitled skill";
}

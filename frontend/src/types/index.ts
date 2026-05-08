export type Language = "en" | "ta" | "hi";

export type ThemeMode = "light" | "dark" | "system";

export type MessageRole = "user" | "ai";

export type WorkflowStepStatus = "pending" | "active" | "complete" | "error";

export type AgentId = "controller" | "planner" | "executor";

export type AgentStatus = "idle" | "active";

export interface AgentRuntime {
  id: AgentId;
  name: string;
  description: string;
  status: AgentStatus;
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: WorkflowStepStatus;
}

export interface ThinkingStep {
  message: string;
  intent: string;
  agent: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  workflow?: WorkflowStep[];
  steps?: ThinkingStep[];
  skillId?: string | null;
  error?: boolean;
  attachments?: AttachmentMeta[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export type Skill = {
  id: string;
  name: string;
  content: string;
  createdAt?: number | string;
  title?: string;
  description?: string;
  prompt?: string;
  category?: AgentId;
  isSystem?: boolean;
};

export interface MemoryProfile {
  preferences: string[];
  repeatedPatterns: string[];
  usageHabits: string[];
  lastSkillId?: string | null;
  updatedAt: string;
}

export interface UserAnalytics {
  messagesSent: number;
  tasksCompleted: number;
  usageCount: number;
  lastActiveAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  preferredLanguage: Language;
  languageSelected: boolean;
  themePreference: ThemeMode;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export interface ChatRequestPayload {
  userId: string;
  userEmail?: string | null;
  chatId: string;
  message: string;
  language: Language;
  agentType?: "office" | "student" | "life" | null;
  skill?: Skill | null;
  skillId?: string | null;
  files?: AttachmentMeta[];
}

export interface ChatResponse {
  message: string;
  response?: string;
  workflow?: WorkflowStep[];
  steps?: ThinkingStep[];
  taskCompleted?: boolean;
  memoryHints?: string[];
}

export interface AttachmentMeta {
  filename: string;
  type: string;
}

export interface DictionaryShape {
  appName: string;
  labels: {
    aiWorkspace: string;
    workspace: string;
    somaUser: string;
    openSidebar: string;
    closeSidebar: string;
    closeSidebarBackdrop: string;
  };
  common: {
    cancel: string;
    saving: string;
    close: string;
    retry: string;
  };
  landing: {
    subtitle: string;
    signIn: string;
    signInLoading: string;
    checkingSession: string;
  };
  language: {
    title: string;
    subtitle: string;
    continue: string;
    loading: string;
  };
  workspace: {
    newChat: string;
    agents: string;
    chats: string;
    skills: string;
    createSkill: string;
    emptyTitle: string;
    emptySubtitle: string;
    thinking: string;
    error: string;
    startFirstConversation: string;
    attached: string;
    noAttachment: string;
    noSkillSelected: string;
    planning: string;
    execution: string;
    result: string;
    examples: string[];
  };
  chat: {
    placeholder: string;
    send: string;
    mic: string;
    speak: string;
    listening: string;
    attach: string;
    chooseSkill: string;
    selectedSkill: string;
    typing: string;
    noMatchingSkills: string;
  };
  topbar: {
    language: string;
    theme: string;
    settings: string;
    logout: string;
  };
  settings: {
    title: string;
    subtitle: string;
    clearHistory: string;
    close: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    logout: string;
  };
  sidebar: {
    agents: string;
    conversations: string;
    noConversations: string;
    rename: string;
    delete: string;
    skillPreview: string;
    noSkills: string;
    active: string;
    idle: string;
  };
  system: {
    firebaseMissing: string;
    voiceUnsupported: string;
    skillSaved: string;
    checkingSession: string;
    loadingWorkspace: string;
    redirecting: string;
    runtimeIssueTitle: string;
    runtimeIssueBody: string;
    networkIssue: string;
    timeoutIssue: string;
    genericIssue: string;
    attachmentUnsupported: string;
    attachmentTooLarge: string;
    signInRequired: string;
    skillNameRequired: string;
    skillAlreadyExists: string;
    skillCloudSyncFailed: string;
    deleteConfirmMismatch: string;
    requestReceived: string;
    executionInterrupted: string;
    noFinalResult: string;
  };
  modals: {
    renameChatTitle: string;
    renameChatDescription: string;
    renameChatPlaceholder: string;
    saveTitle: string;
    createSkillTitle: string;
    createSkillDescription: string;
    createSkillPlaceholder: string;
    deleteChatTitle: string;
    deleteChatDescription: string;
    deleteConfirmLabel: string;
    saveChangeError: string;
  };
}

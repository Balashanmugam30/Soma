export type Language = "en" | "ta" | "hi";

export type ThemeMode = "light" | "dark" | "system";

export type MessageRole = "user" | "ai";

export type WorkflowStepStatus = "pending" | "active" | "complete" | "error";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: WorkflowStepStatus;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  workflow?: WorkflowStep[];
  skillId?: string | null;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  prompt: string;
  createdAt: string;
  isSystem?: boolean;
}

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
  message: string;
  conversationId: string;
  language: Language;
  skill?: Skill | null;
  memory?: MemoryProfile | null;
}

export interface ChatResponse {
  message: string;
  workflow?: WorkflowStep[];
  taskCompleted?: boolean;
  memoryHints?: string[];
}

export interface DictionaryShape {
  appName: string;
  landing: {
    subtitle: string;
    signIn: string;
    signInLoading: string;
  };
  language: {
    title: string;
    subtitle: string;
    continue: string;
  };
  workspace: {
    newChat: string;
    skills: string;
    createSkill: string;
    emptyTitle: string;
    emptySubtitle: string;
    thinking: string;
    error: string;
    examples: string[];
  };
  chat: {
    placeholder: string;
    send: string;
    mic: string;
    speak: string;
    listening: string;
    chooseSkill: string;
    selectedSkill: string;
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
    conversations: string;
    noConversations: string;
    rename: string;
    delete: string;
    skillPreview: string;
    noSkills: string;
  };
  system: {
    firebaseMissing: string;
    voiceUnsupported: string;
    skillSaved: string;
  };
}

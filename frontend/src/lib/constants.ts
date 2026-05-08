import type { AgentRuntime, Language, Skill, ThemeMode, WorkflowStep } from "@/types";

export const STORAGE_KEYS = {
  language: "soma_language",
  theme: "soma-theme",
  conversations: "soma-conversations",
  activeChat: "soma-active-chat",
  skills: "soma-skills",
  selectedSkill: "soma-selected-skill",
  draft: "soma-draft",
  attachment: "soma-attachment",
} as const;

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: "en", label: "English" },
  { value: "ta", label: "தமிழ்" },
  { value: "hi", label: "हिन्दी" },
];

export const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const DEFAULT_SKILLS: Skill[] = [
  {
    id: "study-planner",
    title: "Study Planner",
    name: "Study Planner",
    description: "Design focused study schedules, exam plans, and revision sequences.",
    prompt:
      "Create efficient study plans with learning goals, revision rhythm, and milestone checkpoints.",
    content:
      "Create efficient study plans with learning goals, revision rhythm, and milestone checkpoints.",
    category: "planner",
    createdAt: "system",
    isSystem: true,
  },
  {
    id: "task-manager",
    title: "Task Manager",
    name: "Task Manager",
    description: "Turn scattered tasks into prioritized action plans and focused execution.",
    prompt:
      "Organize work into actionable tasks, priorities, dependencies, and realistic execution order.",
    content:
      "Organize work into actionable tasks, priorities, dependencies, and realistic execution order.",
    category: "controller",
    createdAt: "system",
    isSystem: true,
  },
  {
    id: "research-assistant",
    title: "Research Assistant",
    name: "Research Assistant",
    description: "Structure research questions, comparisons, summaries, and insight synthesis.",
    prompt:
      "Support research with structured investigation, comparisons, summaries, and balanced analysis.",
    content:
      "Support research with structured investigation, comparisons, summaries, and balanced analysis.",
    category: "executor",
    createdAt: "system",
    isSystem: true,
  },
];

export const DEFAULT_AGENTS: AgentRuntime[] = [
  {
    id: "controller",
    name: "Office Agent",
    description: "Manages meetings, tasks, and work schedules.",
    status: "idle",
  },
  {
    id: "planner",
    name: "Student Agent",
    description: "Handles study plans, exams, and learning goals.",
    status: "idle",
  },
  {
    id: "executor",
    name: "Life Agent",
    description: "Helps plan daily life, habits, and routines.",
    status: "idle",
  },
];

export const EXAMPLE_PROMPTS = [
  "Plan my day",
  "Create a study schedule",
  "Organize my tasks",
];

export function createDefaultWorkflowSteps(): WorkflowStep[] {
  return [
    {
      id: "planning",
      label: "Planning",
      description: "Understanding your request and deciding on the best path.",
      status: "complete",
    },
    {
      id: "execution",
      label: "Execution",
      description: "Generating the most useful response with your selected context.",
      status: "complete",
    },
    {
      id: "result",
      label: "Result",
      description: "Packaging the final answer so it is ready to use.",
      status: "complete",
    },
  ];
}

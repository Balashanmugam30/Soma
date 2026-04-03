import type { Language, Skill, ThemeMode, WorkflowStep } from "@/types";

export const STORAGE_KEYS = {
  language: "soma-language",
  theme: "soma-theme",
} as const;

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "hi", label: "Hindi" },
];

export const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const DEFAULT_SKILLS: Skill[] = [
  {
    id: "planner",
    title: "Daily Planner",
    description: "Turn loose goals into a structured, realistic day plan.",
    prompt:
      "Break requests into focused tasks with priorities, time blocks, and clear next steps.",
    createdAt: "system",
    isSystem: true,
  },
  {
    id: "study-coach",
    title: "Study Coach",
    description: "Build smart study schedules, revision plans, and learning routines.",
    prompt:
      "Create study plans with sessions, milestones, retention strategy, and motivation checkpoints.",
    createdAt: "system",
    isSystem: true,
  },
  {
    id: "task-organizer",
    title: "Task Organizer",
    description: "Sort ideas into action items, categories, and execution order.",
    prompt:
      "Organize tasks into categories, dependencies, priorities, and clean execution sequences.",
    createdAt: "system",
    isSystem: true,
  },
  {
    id: "meeting-brief",
    title: "Meeting Brief",
    description: "Prepare concise agendas, talking points, and follow-up summaries.",
    prompt:
      "Draft concise meeting agendas, action items, and decision summaries with professional tone.",
    createdAt: "system",
    isSystem: true,
  },
  {
    id: "creative-writer",
    title: "Creative Writer",
    description: "Shape raw ideas into polished drafts, outlines, and variations.",
    prompt:
      "Transform rough ideas into clear drafts with tone suggestions, structure, and polished phrasing.",
    createdAt: "system",
    isSystem: true,
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

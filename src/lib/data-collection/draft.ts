import { newId } from "./fields";
import type { EmployeeDraft } from "./types";

export function blankDraft(brand = ""): EmployeeDraft {
  const now = new Date().toISOString();
  return {
    id: newId("emp"),
    name: "",
    role: "",
    voice: "priya",
    language: "en-IN",
    brand,
    vertical: "general",
    template: "",
    direction: "outbound",
    purpose: "",
    goal: "",
    successOutcome: "Completed",
    setupQuestions: [],
    setupAnswers: [],
    fields: [],
    openingLine: "",
    instructions: "",
    tone: "Friendly",
    guardrails: ["Don't promise pricing", "Transfer on request", "Respect DND"],
    knowledge: [],
    workflowSteps: [],
    workflow: {
      mode: "none",
      workflowId: null,
      workflowName: null,
      templateKey: null,
      statusActions: {},
    },
    outcomes: [],
    researchMode: "standard",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export const VOICE_PRESETS = [
  { id: "priya", label: "Priya · warm, female" },
  { id: "arjun", label: "Arjun · calm, male" },
  { id: "meera", label: "Meera · bright, female" },
  { id: "kabir", label: "Kabir · confident, male" },
] as const;

export const LANGUAGES = [
  { id: "en-IN", label: "English (India)" },
  { id: "hi-IN", label: "Hindi" },
  { id: "te-IN", label: "Telugu" },
] as const;

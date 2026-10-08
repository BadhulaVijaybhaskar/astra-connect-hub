import { validateFields } from "./fields";
import type { EmployeeDraft } from "./types";

export const WIZARD_STEPS = [
  { id: "identity", label: "Identity", hint: "Name, role and voice" },
  { id: "purpose", label: "Purpose", hint: "Describe what this employee should do" },
  { id: "questions", label: "AI setup questions", hint: "Answer a few tailored questions" },
  { id: "data", label: "Data", hint: "What to collect on every call" },
  { id: "instructions", label: "Instructions", hint: "How it talks and behaves" },
  { id: "workflow", label: "Workflow", hint: "What happens after each call" },
  { id: "review", label: "Review", hint: "Check and create" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export const INSTRUCTIONS_LIMIT = 8000;

/** Hard gate per step. Empty array = the step passes. */
export function stepIssues(step: WizardStepId, d: EmployeeDraft): string[] {
  const issues: string[] = [];
  switch (step) {
    case "identity": {
      const n = d.name.trim().length;
      if (!n) issues.push("Name is required");
      else if (n < 2 || n > 40) issues.push("Name must be 2–40 characters");
      if (!d.role.trim()) issues.push("Role is required");
      if (!d.voice || !d.language) issues.push("Choose a voice and language");
      break;
    }
    case "purpose":
      if (d.purpose.trim().length < 15)
        issues.push("Describe what this employee should do (at least 15 characters)");
      if (!d.successOutcome) issues.push("Choose a success outcome");
      break;
    case "questions": {
      if (!d.setupQuestions.length) {
        issues.push("Generate setup questions first");
        break;
      }
      const byId = new Map(d.setupAnswers.map((a) => [a.questionId, a]));
      let answered = 0;
      for (const q of d.setupQuestions) {
        const a = byId.get(q.id);
        const has =
          a &&
          !a.skipped &&
          a.value !== null &&
          !(Array.isArray(a.value) && a.value.length === 0) &&
          !(typeof a.value === "string" && !a.value.trim());
        if (has) answered++;
        else if (!a?.skipped) issues.push(`Answer or skip: “${q.question}”`);
      }
      if (answered < 2) issues.push("Answer at least 2 questions");
      break;
    }
    case "data":
      if (!d.fields.length) issues.push("Add at least 1 field");
      issues.push(...validateFields(d.fields).map((i) => i.message));
      break;
    case "instructions":
      if (!d.openingLine.trim()) issues.push("Opening line is required");
      if (!d.instructions.trim()) issues.push("Instructions are required");
      if (d.instructions.length > INSTRUCTIONS_LIMIT)
        issues.push(`Instructions must be under ${INSTRUCTIONS_LIMIT} characters`);
      break;
    case "workflow":
      if (d.workflow.mode === "existing" && !d.workflow.workflowId)
        issues.push("Select a workflow to attach");
      if (d.workflow.mode === "template" && !d.workflow.templateKey)
        issues.push("Choose a template");
      break;
    case "review":
      for (const s of WIZARD_STEPS) if (s.id !== "review") issues.push(...stepIssues(s.id, d));
      break;
  }
  return [...new Set(issues)];
}

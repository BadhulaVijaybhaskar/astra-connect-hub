/**
 * Shared types for Smart AI Employee creation + structured Data Collection.
 *
 * Data Collection fields are the VARIABLES that the existing Workflow Builder
 * consumes (`{{data.<key>}}`). Nothing here defines a second workflow engine.
 */

export const FIELD_TYPES = [
  "single_select",
  "multi_select",
  "text",
  "long_text",
  "number",
  "phone",
  "email",
  "date",
  "boolean",
  "rating",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  single_select: "Single select",
  multi_select: "Multi select",
  text: "Text",
  long_text: "Long text",
  number: "Number",
  phone: "Phone",
  email: "Email",
  date: "Date",
  boolean: "Yes / No",
  rating: "Rating 1–5",
};

export type ConditionOperator = "equals" | "not_equals" | "includes" | "is_answered";

/** IF <field_key> <operator> <value> THEN ask this field. */
export interface FieldCondition {
  fieldKey: string;
  operator: ConditionOperator;
  value: string;
}

export type FieldSource = "ask" | "contact";

export interface DataField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  /** How the AI asks it on the call (the AI may rephrase naturally). */
  prompt: string;
  options: string[];
  source: FieldSource;
  validationHint: string;
  /** When set, the field is only asked if the condition matches. */
  condition: FieldCondition | null;
  suggested: boolean;
}

export const CALL_STATUSES = [
  "Ready",
  "Calling",
  "Connected",
  "Completed",
  "Qualified",
  "Callback",
  "Not interested",
  "No answer",
  "Failed",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export type Vertical =
  | "sales"
  | "support"
  | "real_estate"
  | "healthcare"
  | "recruitment"
  | "feedback"
  | "research"
  | "politics"
  | "general";

export type SetupQuestionKind = "chips" | "multi_chips" | "text" | "yes_no";

export interface SetupQuestion {
  id: string;
  question: string;
  kind: SetupQuestionKind;
  options: string[];
  helper: string;
}

export interface SetupAnswer {
  questionId: string;
  value: string | string[] | boolean | null;
  skipped: boolean;
}

export interface WorkflowStep {
  id: string;
  label: string;
  detail: string;
}

export type WorkflowMode = "none" | "existing" | "template";

export interface WorkflowAttachment {
  mode: WorkflowMode;
  workflowId: string | null;
  workflowName: string | null;
  templateKey: string | null;
  /** Per-status quick map, e.g. Qualified -> "Send to CRM". */
  statusActions: Partial<Record<CallStatus, string>>;
}

export interface OutcomeDefinition {
  status: CallStatus;
  meaning: string;
}

export interface KnowledgeSection {
  title: string;
  description: string;
}

export type ResearchMode = "neutral" | "standard";

export interface EmployeeDraft {
  id: string;
  name: string;
  role: string;
  voice: string;
  language: string;
  brand: string;
  vertical: Vertical;
  template: string;
  direction: "outbound" | "inbound";
  purpose: string;
  goal: string;
  successOutcome: CallStatus;
  setupQuestions: SetupQuestion[];
  setupAnswers: SetupAnswer[];
  fields: DataField[];
  openingLine: string;
  instructions: string;
  tone: string;
  guardrails: string[];
  knowledge: KnowledgeSection[];
  workflowSteps: WorkflowStep[];
  workflow: WorkflowAttachment;
  outcomes: OutcomeDefinition[];
  researchMode: ResearchMode;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

/** A normalized answer for one field on one call. */
export type NormalizedValue = string | number | boolean | string[] | null;

export interface CallAnswer {
  fieldKey: string;
  rawAnswer: string;
  normalizedAnswer: NormalizedValue;
}

export type ResultSource = "runtime" | "test" | "sample";

export interface CallResult {
  id: string;
  employeeId: string;
  callId: string;
  contactName: string;
  phone: string;
  status: CallStatus;
  startedAt: string;
  durationSeconds: number;
  answers: CallAnswer[];
  transcript: string;
  summary: string;
  recordingUrl: string | null;
  /** "sample" rows are seeded demo data and must never be shown as live. */
  source: ResultSource;
  campaign: string;
}

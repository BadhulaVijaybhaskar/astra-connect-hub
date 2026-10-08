/**
 * Setup engine: turns a plain-language purpose into setup questions, then
 * turns the answers into fields, instructions, knowledge, workflow steps and
 * outcomes.
 *
 * The repository has no LLM endpoint today, so `templateSetupGenerator` is a
 * deterministic, keyword-driven engine. Any LLM-backed implementation only has
 * to satisfy `SetupGenerator` and can be swapped in via `getSetupGenerator()`.
 */
import { VERTICAL_TEMPLATES, type CatalogField, type VerticalTemplate } from "./catalog";
import { PREFER_NOT_TO_ANSWER, makeField } from "./fields";
import type {
  CallStatus,
  DataField,
  KnowledgeSection,
  OutcomeDefinition,
  ResearchMode,
  SetupAnswer,
  SetupQuestion,
  Vertical,
  WorkflowStep,
} from "./types";

export interface SetupContext {
  name: string;
  role: string;
  brand: string;
  purpose: string;
  goal: string;
  direction: "outbound" | "inbound";
  vertical: Vertical;
}

export interface GeneratedSetup {
  fields: DataField[];
  openingLine: string;
  instructions: string;
  knowledge: KnowledgeSection[];
  workflowSteps: WorkflowStep[];
  outcomes: OutcomeDefinition[];
  researchMode: ResearchMode;
  statusActions: Partial<Record<CallStatus, string>>;
  objective: string;
}

export interface SetupGenerator {
  readonly kind: "template" | "llm";
  detectVertical(purpose: string): Vertical;
  questions(ctx: SetupContext): Promise<SetupQuestion[]>;
  generate(ctx: SetupContext, answers: SetupAnswer[]): Promise<GeneratedSetup>;
}

const VERTICAL_ORDER: Vertical[] = [
  "politics",
  "real_estate",
  "healthcare",
  "recruitment",
  "support",
  "feedback",
  "research",
  "sales",
];

export function detectVertical(purpose: string): Vertical {
  const text = ` ${purpose.toLowerCase()} `;
  let best: Vertical = "general";
  let bestScore = 0;
  for (const v of VERTICAL_ORDER) {
    const score = VERTICAL_TEMPLATES[v].keywords.reduce(
      (acc, k) => (text.includes(k) ? acc + 1 : acc),
      0,
    );
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

export function templateFor(vertical: Vertical): VerticalTemplate {
  return VERTICAL_TEMPLATES[vertical];
}

export function buildQuestions(ctx: SetupContext): SetupQuestion[] {
  const t = templateFor(ctx.vertical);
  const collectables = t.catalog.map((c) => c.label);
  const who = ctx.direction === "inbound" ? "Who will be calling in?" : "Who will the AI call?";
  return [
    {
      id: "audience",
      question: who,
      kind: "chips",
      options: t.audienceOptions,
      helper: "Used in the introduction and the call context.",
    },
    {
      id: "collect",
      question: "What information do you want to collect?",
      kind: "multi_chips",
      options: collectables,
      helper: "Each item becomes a structured field and a column in Results.",
    },
    {
      id: "options",
      question: t.optionsQuestion,
      kind: "text",
      options: [],
      helper: t.optionsHelper,
    },
    {
      id: "mandatory",
      question: "Which questions are mandatory?",
      kind: "multi_chips",
      options: collectables,
      helper: "A call only counts as complete when these are answered.",
    },
    {
      id: "followups",
      question: "Should follow-up questions be asked?",
      kind: "yes_no",
      options: [],
      helper: "For example, ask for a reason after a choice.",
    },
    {
      id: "after",
      question: "What should happen after the call is completed?",
      kind: "chips",
      options: t.afterOptions,
      helper: "Mapped to an action you can refine in the Workflow Builder.",
    },
  ];
}

/** Default answers so "Use default questions" never dead-ends the flow. */
export function defaultAnswers(ctx: SetupContext): SetupAnswer[] {
  const t = templateFor(ctx.vertical);
  return [
    { questionId: "audience", value: t.audienceOptions[0] ?? "", skipped: false },
    {
      questionId: "collect",
      value: t.catalog.filter((c) => c.defaultCollect).map((c) => c.label),
      skipped: false,
    },
    { questionId: "options", value: t.defaultOptions, skipped: !t.defaultOptions },
    {
      questionId: "mandatory",
      value: t.catalog.filter((c) => c.defaultRequired).map((c) => c.label),
      skipped: false,
    },
    { questionId: "followups", value: true, skipped: false },
    { questionId: "after", value: t.afterOptions[0] ?? "End call", skipped: false },
  ];
}

function answerOf(answers: SetupAnswer[], id: string): SetupAnswer["value"] {
  const a = answers.find((x) => x.questionId === id);
  if (!a || a.skipped) return null;
  return a.value;
}

function asList(v: SetupAnswer["value"]): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string")
    return v
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const k = x.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function catalogToField(
  c: CatalogField,
  answerOptions: string[],
  required: boolean,
  withFollowups: boolean,
  isNeutral: boolean,
): DataField {
  let options = c.options ?? [];
  if (c.optionsFromAnswer) options = uniq([...answerOptions, ...c.optionsFromAnswer.extra]);
  if (isNeutral && (c.type === "single_select" || c.type === "multi_select"))
    options = uniq([...options, PREFER_NOT_TO_ANSWER]);
  return makeField(c.label, c.type, {
    key: c.key,
    prompt: c.prompt,
    options,
    required,
    source: c.source ?? "ask",
    validationHint:
      c.validationHint ?? (c.type === "rating" ? "1 to 5" : c.type === "phone" ? "10 digits" : ""),
    condition: withFollowups && c.condition ? { ...c.condition } : null,
    suggested: true,
  });
}

export function buildFields(ctx: SetupContext, answers: SetupAnswer[]): DataField[] {
  const t = templateFor(ctx.vertical);
  const collect = asList(answerOf(answers, "collect"));
  const mandatory = new Set(asList(answerOf(answers, "mandatory")));
  const followups = answerOf(answers, "followups") !== false;
  const answerOptions = asList(answerOf(answers, "options"));
  const fallbackOptions = asList(t.defaultOptions);
  const isNeutral = ctx.vertical === "politics";
  const chosen = collect.length
    ? t.catalog.filter((c) => collect.includes(c.label))
    : t.catalog.filter((c) => c.defaultCollect);
  const keys = new Set(chosen.map((c) => c.key));
  return chosen.map((c) => {
    const f = catalogToField(
      c,
      answerOptions.length ? answerOptions : fallbackOptions,
      mandatory.has(c.label),
      followups,
      isNeutral,
    );
    // Drop a follow-up condition whose parent field was not selected.
    if (f.condition && !keys.has(f.condition.fieldKey)) f.condition = null;
    return f;
  });
}

export function conditionText(f: DataField): string {
  if (!f.condition) return "";
  const c = f.condition;
  const op =
    c.operator === "equals"
      ? `is "${c.value}"`
      : c.operator === "not_equals"
        ? `is not "${c.value}"`
        : c.operator === "includes"
          ? `includes "${c.value}"`
          : "is answered";
  return `only if ${c.fieldKey} ${op}`;
}

export function buildInstructions(
  ctx: SetupContext,
  fields: DataField[],
  answers: SetupAnswer[],
): { openingLine: string; instructions: string } {
  const t = templateFor(ctx.vertical);
  const brand = ctx.brand.trim() || "our team";
  const name = ctx.name.trim() || "the assistant";
  const audience = answerOf(answers, "audience");
  const after = answerOf(answers, "after");
  const neutral = ctx.vertical === "politics";

  const openingLine = neutral
    ? `Hello, this is ${name} calling on behalf of ${brand}. We are doing a short, independent opinion survey in your area. It takes about three minutes. Is this a good time?`
    : ctx.direction === "inbound"
      ? `Hi, thanks for calling ${brand}. I'm ${name}. How can I help you today?`
      : `Hi, this is ${name} from ${brand}. Is this a good time for a quick two-minute call?`;

  const questionLines = fields
    .filter((f) => f.source === "ask")
    .map((f, i) => {
      const req = f.required ? " (required)" : "";
      const cond = f.condition ? ` [${conditionText(f)}]` : "";
      const opts = f.options.length ? ` Options: ${f.options.join(", ")}.` : "";
      return `${i + 1}. ${f.label}${req}${cond}: "${f.prompt}"${opts} Save to ${f.key}.`;
    });

  const sections = [
    `## Role\nYou are ${name}, ${ctx.role || t.employeeNoun} for ${brand}. ${t.objective}${
      ctx.goal ? ` Goal: ${ctx.goal.trim()}` : ""
    }${typeof audience === "string" && audience ? ` You speak with: ${audience}.` : ""}`,
    `## Greeting\nOpen with the opening line, confirm it is a good time, and ask for consent to continue. If they say no, offer a callback and end politely.`,
    `## Questions\nAsk one question at a time, in this order. Phrase each one naturally, but always save the answer to its field key. Keep the caller's exact words as the raw answer.\n${questionLines.join("\n")}`,
    neutral
      ? `## Neutral research mode\n- You are a neutral researcher. Never persuade, praise or criticise any candidate, party or government.\n- Never share your own opinion or suggest an answer.\n- Read options in the same neutral tone. Record exactly what the respondent says.\n- Undecided and Prefer not to answer are valid answers. If the respondent declines a question, record "${PREFER_NOT_TO_ANSWER}" and move on naturally.`
      : `## Objections\nAnswer briefly and honestly, then return to the next question. Never promise pricing, discounts or outcomes that are not in your knowledge. Transfer to a human on request.`,
    `## Closing\nConfirm the key answers back in one sentence, thank them, then: ${
      typeof after === "string" && after ? after : "end the call"
    }.`,
    `## Style\nConcise, warm, natural Indian business English. One question per turn. 1–2 short sentences.`,
  ];
  return { openingLine, instructions: sections.join("\n\n") };
}

export function buildWorkflowSteps(
  ctx: SetupContext,
  fields: DataField[],
  after: string,
): WorkflowStep[] {
  const hasFollowups = fields.some((f) => f.condition);
  const noun =
    ctx.vertical === "politics" || ctx.vertical === "research" || ctx.vertical === "feedback"
      ? "Survey"
      : "Qualification";
  const steps: WorkflowStep[] = [
    {
      id: "start",
      label: "Start Call",
      detail: ctx.direction === "inbound" ? "Inbound call answered" : "Outbound call placed",
    },
    { id: "intro", label: "Introduction", detail: "Opening line" },
    { id: "consent", label: "Consent / Continue", detail: "Callback if not a good time" },
    {
      id: "questions",
      label: `${noun} Questions`,
      detail: `${fields.filter((f) => !f.condition).length} core questions`,
    },
  ];
  if (hasFollowups)
    steps.push({
      id: "followups",
      label: "Conditional Follow-ups",
      detail: `${fields.filter((f) => f.condition).length} IF / THEN follow-ups`,
    });
  steps.push({
    id: "save",
    label: "Save Responses",
    detail: "raw_answer + normalized_answer per field",
  });
  if (after && after !== "End call")
    steps.push({ id: "action", label: after, detail: "Configured in Workflow Builder" });
  steps.push({ id: "end", label: "End Call", detail: "Outcome recorded" });
  return steps;
}

export function buildOutcomes(vertical: Vertical): OutcomeDefinition[] {
  const t = templateFor(vertical);
  const base: OutcomeDefinition[] = [
    { status: "Completed", meaning: "All required fields answered." },
    { status: "Callback", meaning: "Asked to be called back later." },
    { status: "Not interested", meaning: "Declined to continue." },
    { status: "No answer", meaning: "Call not picked up." },
    { status: "Failed", meaning: "Call could not connect." },
  ];
  if (t.successOutcome === "Qualified")
    base.unshift({
      status: "Qualified",
      meaning: "Meets the qualification rules; route to the team.",
    });
  return base;
}

export function buildStatusActions(
  vertical: Vertical,
  after: string,
): Partial<Record<CallStatus, string>> {
  const t = templateFor(vertical);
  const map: Partial<Record<CallStatus, string>> = { Callback: "Schedule retry" };
  map[t.successOutcome] = after || "End call";
  return map;
}

export const templateSetupGenerator: SetupGenerator = {
  kind: "template",
  detectVertical,
  async questions(ctx) {
    return buildQuestions(ctx);
  },
  async generate(ctx, answers) {
    const t = templateFor(ctx.vertical);
    const fields = buildFields(ctx, answers);
    const afterRaw = answerOf(answers, "after");
    const after = typeof afterRaw === "string" ? afterRaw : "End call";
    const { openingLine, instructions } = buildInstructions(ctx, fields, answers);
    return {
      fields,
      openingLine,
      instructions,
      knowledge: t.knowledge.map((k) => ({ ...k })),
      workflowSteps: buildWorkflowSteps(ctx, fields, after),
      outcomes: buildOutcomes(ctx.vertical),
      researchMode: ctx.vertical === "politics" ? "neutral" : "standard",
      statusActions: buildStatusActions(ctx.vertical, after),
      objective: t.objective,
    };
  },
};

/** Swap point for an LLM-backed generator (e.g. a server function). */
export function getSetupGenerator(): SetupGenerator {
  return templateSetupGenerator;
}

/** Labels of required fields that the instructions never mention. */
export function missingFieldMentions(instructions: string, fields: DataField[]): DataField[] {
  const text = instructions.toLowerCase();
  return fields.filter(
    (f) =>
      f.required && !text.includes(f.key.toLowerCase()) && !text.includes(f.label.toLowerCase()),
  );
}

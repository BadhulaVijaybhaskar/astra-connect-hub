/**
 * Bridge to the EXISTING Workflow Builder (a separate surface, unchanged).
 * The wizard only attaches / templates a workflow and deep-links to the
 * builder. Only real workflows are listed: if the platform API is not
 * configured or unreachable we show an honest empty / error state.
 */
import type { WorkflowStep } from "./types";

export interface WorkflowSummary {
  id: string;
  name: string;
  direction: string;
  status: string;
  updatedAt: string | null;
}

export type WorkflowListResult =
  | { state: "unconfigured"; workflows: [] }
  | { state: "ok"; workflows: WorkflowSummary[] }
  | { state: "error"; workflows: []; message: string };

function env(name: string): string {
  const v = (import.meta.env as Record<string, unknown>)[name];
  return typeof v === "string" ? v.trim() : "";
}

/** e.g. https://app.example.com/app#/workflows or .../workflows/{id} */
export function workflowBuilderUrl(workflowId?: string | null): string | null {
  const base = env("VITE_WORKFLOW_BUILDER_URL");
  if (!base) return null;
  if (workflowId && base.includes("{id}"))
    return base.replace("{id}", encodeURIComponent(workflowId));
  return base.replace("{id}", "");
}

export async function listWorkflows(signal?: AbortSignal): Promise<WorkflowListResult> {
  const api = env("VITE_ASTRA_PLATFORM_URL");
  if (!api) return { state: "unconfigured", workflows: [] };
  try {
    const res = await fetch(`${api.replace(/\/$/, "")}/api/workflows`, {
      credentials: "include",
      ...(signal ? { signal } : {}),
    });
    if (!res.ok) return { state: "error", workflows: [], message: `HTTP ${res.status}` };
    const body = (await res.json()) as { workflows?: unknown };
    const list = Array.isArray(body.workflows) ? body.workflows : [];
    const workflows = list
      .filter((w): w is Record<string, unknown> => !!w && typeof w === "object")
      .filter((w) => w["status"] !== "archived")
      .map((w) => ({
        id: String(w["id"] ?? ""),
        name: String(w["name"] ?? "Untitled workflow"),
        direction: String(w["direction"] ?? "both"),
        status: String(w["status"] ?? "draft"),
        updatedAt: typeof w["updatedAt"] === "string" ? w["updatedAt"] : null,
      }))
      .filter((w) => w.id);
    return { state: "ok", workflows };
  } catch (e) {
    return {
      state: "error",
      workflows: [],
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}

export interface WorkflowTemplate {
  key: string;
  name: string;
  description: string;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    key: "survey_basic",
    name: "Survey: save and end",
    description: "Ask questions, save responses, end the call.",
  },
  {
    key: "qualify_route",
    name: "Qualify and route",
    description: "Qualified leads go to sales; others get a follow-up.",
  },
  {
    key: "callback_retry",
    name: "Callback and retry",
    description: "Callbacks are scheduled and retried automatically.",
  },
  {
    key: "ticket_handoff",
    name: "Ticket and handoff",
    description: "Create a ticket, transfer on request.",
  },
];

/**
 * Blueprint handed to the Workflow Builder when "Start from template" is
 * chosen. It is a suggestion the builder imports, not a second engine.
 */
export function templateBlueprint(templateKey: string, steps: WorkflowStep[], variables: string[]) {
  return {
    version: 1,
    templateKey,
    steps: steps.map((s) => ({ id: s.id, name: s.label, note: s.detail })),
    variables,
  };
}

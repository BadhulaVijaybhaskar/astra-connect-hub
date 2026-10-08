/**
 * Persistence for employees, Data Collection fields and per-call results.
 *
 * - "workspace" mode: Supabase tables from drizzle/migrations/0001_data_collection.sql,
 *   protected by RLS (owner_id = auth.uid()). Used when a signed-in session exists.
 * - "local" mode: browser localStorage. Used when there is no session (the
 *   marketing site has no sign-in yet). The UI labels this clearly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CallAnswer, CallResult, DataField, EmployeeDraft } from "./types";

export type StoreMode = "workspace" | "local";

export interface EmployeeRepository {
  readonly mode: StoreMode;
  listEmployees(): Promise<EmployeeDraft[]>;
  getEmployee(id: string): Promise<EmployeeDraft | null>;
  saveEmployee(employee: EmployeeDraft): Promise<EmployeeDraft>;
  saveFields(employeeId: string, fields: DataField[]): Promise<void>;
  listResults(employeeId: string): Promise<CallResult[]>;
  addSampleResults(employeeId: string, results: CallResult[]): Promise<void>;
  clearSampleResults(employeeId: string): Promise<void>;
}

/* ----------------------------- local ----------------------------- */

const LOCAL_KEY = "astra.ai-employees.v1";

interface LocalShape {
  employees: EmployeeDraft[];
  results: Record<string, CallResult[]>;
}

function readLocal(): LocalShape {
  if (typeof window === "undefined") return { employees: [], results: {} };
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { employees: [], results: {} };
    const parsed = JSON.parse(raw) as Partial<LocalShape>;
    return { employees: parsed.employees ?? [], results: parsed.results ?? {} };
  } catch {
    return { employees: [], results: {} };
  }
}

function writeLocal(data: LocalShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

export const localRepository: EmployeeRepository = {
  mode: "local",
  async listEmployees() {
    return readLocal().employees.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async getEmployee(id) {
    return readLocal().employees.find((e) => e.id === id) ?? null;
  },
  async saveEmployee(employee) {
    const data = readLocal();
    const next = { ...employee, updatedAt: new Date().toISOString() };
    const idx = data.employees.findIndex((e) => e.id === employee.id);
    if (idx >= 0) data.employees[idx] = next;
    else data.employees.push(next);
    writeLocal(data);
    return next;
  },
  async saveFields(employeeId, fields) {
    const data = readLocal();
    const e = data.employees.find((x) => x.id === employeeId);
    if (e) {
      e.fields = fields;
      e.updatedAt = new Date().toISOString();
    }
    writeLocal(data);
  },
  async listResults(employeeId) {
    return readLocal().results[employeeId] ?? [];
  },
  async addSampleResults(employeeId, results) {
    const data = readLocal();
    const existing = (data.results[employeeId] ?? []).filter((r) => r.source !== "sample");
    data.results[employeeId] = [
      ...existing,
      ...results.map((r) => ({ ...r, source: "sample" as const })),
    ];
    writeLocal(data);
  },
  async clearSampleResults(employeeId) {
    const data = readLocal();
    data.results[employeeId] = (data.results[employeeId] ?? []).filter(
      (r) => r.source !== "sample",
    );
    writeLocal(data);
  },
};

/* --------------------------- workspace --------------------------- */

type Row = Record<string, unknown>;

function employeeToRow(e: EmployeeDraft): Row {
  const {
    id,
    name,
    role,
    status,
    vertical,
    researchMode,
    fields: _fields,
    createdAt: _c,
    updatedAt: _u,
    ...config
  } = e;
  return { id, name, role, status, vertical, research_mode: researchMode, config };
}

function fieldToRow(employeeId: string, f: DataField, position: number): Row {
  return {
    id: f.id,
    employee_id: employeeId,
    position,
    key: f.key,
    label: f.label,
    type: f.type,
    required: f.required,
    prompt: f.prompt,
    options: f.options,
    source: f.source,
    validation_hint: f.validationHint,
    condition: f.condition,
    suggested: f.suggested,
  };
}

function rowToField(r: Row): DataField {
  return {
    id: String(r["id"]),
    key: String(r["key"]),
    label: String(r["label"]),
    type: r["type"] as DataField["type"],
    required: Boolean(r["required"]),
    prompt: String(r["prompt"] ?? ""),
    options: Array.isArray(r["options"]) ? (r["options"] as string[]) : [],
    source: (r["source"] as DataField["source"]) ?? "ask",
    validationHint: String(r["validation_hint"] ?? ""),
    condition: (r["condition"] as DataField["condition"]) ?? null,
    suggested: Boolean(r["suggested"]),
  };
}

function rowToEmployee(r: Row, fields: DataField[]): EmployeeDraft {
  const config = (r["config"] ?? {}) as Partial<EmployeeDraft>;
  return {
    ...(config as EmployeeDraft),
    id: String(r["id"]),
    name: String(r["name"]),
    role: String(r["role"] ?? ""),
    status: r["status"] === "published" ? "published" : "draft",
    vertical: (r["vertical"] as EmployeeDraft["vertical"]) ?? "general",
    researchMode: r["research_mode"] === "neutral" ? "neutral" : "standard",
    fields,
    createdAt: String(r["created_at"]),
    updatedAt: String(r["updated_at"]),
  };
}

export function createWorkspaceRepository(db: SupabaseClient): EmployeeRepository {
  const fieldsFor = async (employeeIds: string[]) => {
    if (!employeeIds.length) return new Map<string, DataField[]>();
    const { data, error } = await db
      .from("ac_data_fields")
      .select("*")
      .in("employee_id", employeeIds)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const map = new Map<string, DataField[]>();
    for (const row of (data ?? []) as Row[]) {
      const id = String(row["employee_id"]);
      map.set(id, [...(map.get(id) ?? []), rowToField(row)]);
    }
    return map;
  };
  const repo: EmployeeRepository = {
    mode: "workspace",
    async listEmployees() {
      const { data, error } = await db
        .from("ac_employees")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Row[];
      const fields = await fieldsFor(rows.map((r) => String(r["id"])));
      return rows.map((r) => rowToEmployee(r, fields.get(String(r["id"])) ?? []));
    },
    async getEmployee(id) {
      const { data, error } = await db.from("ac_employees").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const fields = await fieldsFor([id]);
      return rowToEmployee(data as Row, fields.get(id) ?? []);
    },
    async saveEmployee(employee) {
      const { error } = await db.from("ac_employees").upsert(employeeToRow(employee));
      if (error) throw new Error(error.message);
      await repo.saveFields(employee.id, employee.fields);
      return (await repo.getEmployee(employee.id)) ?? employee;
    },
    async saveFields(employeeId, fields) {
      const keep = fields.map((f) => f.id);
      const del = db.from("ac_data_fields").delete().eq("employee_id", employeeId);
      const { error: delErr } = keep.length
        ? await del.not("id", "in", `(${keep.join(",")})`)
        : await del;
      if (delErr) throw new Error(delErr.message);
      if (!fields.length) return;
      const { error } = await db
        .from("ac_data_fields")
        .upsert(fields.map((f, i) => fieldToRow(employeeId, f, i)));
      if (error) throw new Error(error.message);
    },
    async listResults(employeeId) {
      const { data, error } = await db
        .from("ac_call_results")
        .select("*, ac_call_answers(field_key, raw_answer, normalized_answer)")
        .eq("employee_id", employeeId)
        .order("started_at", { ascending: false })
        .limit(1000);
      if (error) throw new Error(error.message);
      return ((data ?? []) as Row[]).map((r) => ({
        id: String(r["id"]),
        employeeId,
        callId: String(r["call_id"]),
        contactName: String(r["contact_name"] ?? ""),
        phone: String(r["phone"] ?? ""),
        status: r["status"] as CallResult["status"],
        startedAt: String(r["started_at"]),
        durationSeconds: Number(r["duration_seconds"] ?? 0),
        answers: ((r["ac_call_answers"] ?? []) as Row[]).map((a): CallAnswer => ({
          fieldKey: String(a["field_key"]),
          rawAnswer: String(a["raw_answer"] ?? ""),
          normalizedAnswer: (a["normalized_answer"] ?? null) as CallAnswer["normalizedAnswer"],
        })),
        transcript: String(r["transcript"] ?? ""),
        summary: String(r["summary"] ?? ""),
        recordingUrl: (r["recording_url"] as string | null) ?? null,
        source: (r["source"] as CallResult["source"]) ?? "runtime",
        campaign: String(r["campaign"] ?? ""),
      }));
    },
    async addSampleResults(employeeId, results) {
      await repo.clearSampleResults(employeeId);
      for (const r of results) {
        const { data, error } = await db
          .from("ac_call_results")
          .insert({
            employee_id: employeeId,
            call_id: r.callId,
            contact_name: r.contactName,
            phone: r.phone,
            status: r.status,
            started_at: r.startedAt,
            duration_seconds: r.durationSeconds,
            transcript: r.transcript,
            summary: r.summary,
            source: "sample",
            campaign: r.campaign,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        const callId = String((data as Row)["id"]);
        if (r.answers.length) {
          const { error: aErr } = await db.from("ac_call_answers").insert(
            r.answers.map((a) => ({
              call_result_id: callId,
              employee_id: employeeId,
              field_key: a.fieldKey,
              raw_answer: a.rawAnswer,
              normalized_answer: a.normalizedAnswer,
            })),
          );
          if (aErr) throw new Error(aErr.message);
        }
      }
    },
    async clearSampleResults(employeeId) {
      const { error } = await db
        .from("ac_call_results")
        .delete()
        .eq("employee_id", employeeId)
        .eq("source", "sample");
      if (error) throw new Error(error.message);
    },
  };
  return repo;
}

let cached: Promise<EmployeeRepository> | null = null;

/** Workspace when Supabase is configured AND a user is signed in; otherwise local. */
export function getRepository(): Promise<EmployeeRepository> {
  if (cached) return cached;
  cached = (async () => {
    if (typeof window === "undefined") return localRepository;
    const env = import.meta.env as Record<string, unknown>;
    if (!env["VITE_SUPABASE_URL"] || !env["VITE_SUPABASE_PUBLISHABLE_KEY"]) return localRepository;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (!data.session) return localRepository;
      return createWorkspaceRepository(supabase as unknown as SupabaseClient);
    } catch {
      return localRepository;
    }
  })();
  return cached;
}

/* ------------------------ wizard draft (local) ------------------------ */

const WIZARD_KEY = "astra.ai-employee-wizard.v1";

export function saveWizardDraft(draft: EmployeeDraft, step: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WIZARD_KEY, JSON.stringify({ draft, step, savedAt: Date.now() }));
}

export function loadWizardDraft(): { draft: EmployeeDraft; step: number; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WIZARD_KEY);
    return raw
      ? (JSON.parse(raw) as { draft: EmployeeDraft; step: number; savedAt: number })
      : null;
  } catch {
    return null;
  }
}

export function clearWizardDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WIZARD_KEY);
}

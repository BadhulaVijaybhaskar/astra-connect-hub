import type { DataField, FieldType } from "./types";

export const PREFER_NOT_TO_ANSWER = "Prefer not to answer";

export function slugifyKey(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  if (!slug) return "field";
  return /^[0-9]/.test(slug) ? `f_${slug}` : slug;
}

export function newId(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

export function isSelectType(type: FieldType): boolean {
  return type === "single_select" || type === "multi_select";
}

export function makeField(
  label: string,
  type: FieldType,
  init: Partial<Omit<DataField, "id" | "label" | "type">> = {},
): DataField {
  return {
    id: newId("fld"),
    key: init.key ?? slugifyKey(label),
    label,
    type,
    required: init.required ?? false,
    prompt: init.prompt ?? `Ask: ${label}?`,
    options: init.options ?? [],
    source: init.source ?? "ask",
    validationHint: init.validationHint ?? "",
    condition: init.condition ?? null,
    suggested: init.suggested ?? false,
  };
}

/** Workflow Builder variable token for a field. */
export function variableToken(key: string): string {
  return `{{data.${key}}}`;
}

export interface FieldIssue {
  fieldId: string;
  message: string;
}

/** Gate for the Data step and the Data Collection tab. */
export function validateFields(fields: DataField[]): FieldIssue[] {
  const issues: FieldIssue[] = [];
  const seen = new Map<string, string>();
  for (const f of fields) {
    if (!f.label.trim()) issues.push({ fieldId: f.id, message: "Field name is required" });
    if (!/^[a-z][a-z0-9_]*$/.test(f.key))
      issues.push({
        fieldId: f.id,
        message: "Key must be lowercase letters, numbers, underscores",
      });
    const dup = seen.get(f.key);
    if (dup) issues.push({ fieldId: f.id, message: `Duplicate key "${f.key}"` });
    seen.set(f.key, f.id);
    if (isSelectType(f.type) && f.options.filter((o) => o.trim()).length < 2)
      issues.push({ fieldId: f.id, message: "Select fields need at least 2 options" });
    if (f.condition) {
      const parent = fields.find((p) => p.key === f.condition?.fieldKey);
      if (!parent || parent.id === f.id)
        issues.push({ fieldId: f.id, message: "Follow-up condition points to a missing field" });
    }
  }
  return issues;
}

export function moveField(fields: DataField[], id: string, delta: -1 | 1): DataField[] {
  const idx = fields.findIndex((f) => f.id === id);
  const target = idx + delta;
  if (idx < 0 || target < 0 || target >= fields.length) return fields;
  const next = fields.slice();
  const [item] = next.splice(idx, 1);
  if (item) next.splice(target, 0, item);
  return next;
}

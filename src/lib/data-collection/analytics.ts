import { formatValue } from "./normalize";
import type { CallResult, DataField, NormalizedValue } from "./types";
import { shouldAsk } from "./conditions";

export type Completion = "complete" | "partial" | "none";

export function answerMap(result: CallResult): Record<string, NormalizedValue> {
  const out: Record<string, NormalizedValue> = {};
  for (const a of result.answers) out[a.fieldKey] = a.normalizedAnswer;
  return out;
}

function hasValue(v: NormalizedValue | undefined): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== "";
}

/**
 * complete = every required field that applies (IF/THEN aware) has a value.
 * partial  = at least one answer but a required one is missing.
 * none     = no answers at all.
 */
export function completionOf(result: CallResult, fields: DataField[]): Completion {
  const answers = answerMap(result);
  const answeredCount = Object.values(answers).filter(hasValue).length;
  if (answeredCount === 0) return "none";
  const missing = fields.some(
    (f) => f.required && shouldAsk(f, answers) && !hasValue(answers[f.key]),
  );
  return missing ? "partial" : "complete";
}

export const COMPLETION_LABEL: Record<Completion, string> = {
  complete: "Complete",
  partial: "Partial",
  none: "No response",
};

export interface FieldBreakdown {
  key: string;
  label: string;
  answered: number;
  /** Ordered value -> count, for select / boolean / rating fields. */
  distribution: { value: string; count: number; pct: number }[];
  average: number | null;
}

export interface AnalyticsSummary {
  totalCalls: number;
  connected: number;
  complete: number;
  partial: number;
  noResponse: number;
  completionRate: number;
  fields: FieldBreakdown[];
  sampleOnly: boolean;
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

export function computeAnalytics(fields: DataField[], results: CallResult[]): AnalyticsSummary {
  let complete = 0;
  let partial = 0;
  let noResponse = 0;
  for (const r of results) {
    const c = completionOf(r, fields);
    if (c === "complete") complete++;
    else if (c === "partial") partial++;
    else noResponse++;
  }
  const connected = results.filter(
    (r) => !["No answer", "Failed", "Ready", "Calling"].includes(r.status),
  ).length;
  const breakdowns: FieldBreakdown[] = fields.map((f) => {
    const values = results
      .map((r) => r.answers.find((a) => a.fieldKey === f.key)?.normalizedAnswer)
      .filter((v): v is Exclude<NormalizedValue, null> => hasValue(v ?? null));
    const counts = new Map<string, number>();
    const categorical = ["single_select", "multi_select", "boolean", "rating"].includes(f.type);
    if (categorical) {
      for (const v of values) {
        const items = Array.isArray(v) ? v : [formatValue(v)];
        for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    const order = f.type === "rating" ? ["1", "2", "3", "4", "5"] : f.options;
    const keys = [
      ...order.filter((o) => counts.has(o)),
      ...[...counts.keys()].filter((k) => !order.includes(k)),
    ];
    const numeric =
      f.type === "rating" || f.type === "number"
        ? values.map(Number).filter((n) => !Number.isNaN(n))
        : [];
    return {
      key: f.key,
      label: f.label,
      answered: values.length,
      distribution: keys.map((k) => ({
        value: k,
        count: counts.get(k) ?? 0,
        pct: pct(counts.get(k) ?? 0, values.length),
      })),
      average: numeric.length
        ? Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 100) / 100
        : null,
    };
  });
  return {
    totalCalls: results.length,
    connected,
    complete,
    partial,
    noResponse,
    completionRate: pct(complete, results.length),
    fields: breakdowns,
    sampleOnly: results.length > 0 && results.every((r) => r.source === "sample"),
  };
}

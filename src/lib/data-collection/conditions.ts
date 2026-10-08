import { formatValue } from "./normalize";
import type { DataField, NormalizedValue } from "./types";

/** IF/THEN: should this field be asked given answers so far? */
export function shouldAsk(
  field: DataField,
  answers: Record<string, NormalizedValue | undefined>,
): boolean {
  const c = field.condition;
  if (!c) return true;
  const value = answers[c.fieldKey];
  if (value === undefined || value === null || value === "") return false;
  const want = c.value.trim().toLowerCase();
  switch (c.operator) {
    case "is_answered":
      return true;
    case "includes":
      return Array.isArray(value)
        ? value.some((v) => v.toLowerCase() === want)
        : formatValue(value).toLowerCase().includes(want);
    case "equals":
      return formatValue(value).toLowerCase() === want;
    case "not_equals":
      return formatValue(value).toLowerCase() !== want;
    default:
      return true;
  }
}

/** Fields to ask, in order, for a given partial answer set. */
export function fieldsToAsk(
  fields: DataField[],
  answers: Record<string, NormalizedValue | undefined>,
): DataField[] {
  return fields.filter((f) => f.source === "ask" && shouldAsk(f, answers));
}

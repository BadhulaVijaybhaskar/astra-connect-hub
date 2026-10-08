/**
 * Analysis-ready export: ONE call = ONE row, ONE field = ONE column.
 * Never a single JSON blob column.
 */
import { COMPLETION_LABEL, completionOf } from "./analytics";
import { formatValue } from "./normalize";
import { localDay } from "./results";
import type { CallResult, DataField } from "./types";

export type Cell = string | number | null;

export interface ExportColumn {
  id: string;
  header: string;
  kind: "meta" | "field" | "raw";
  numeric: boolean;
}

export interface ExportOptions {
  includeRaw?: boolean;
}

const META_HEAD: ExportColumn[] = [
  { id: "call_id", header: "Call ID", kind: "meta", numeric: false },
  { id: "timestamp", header: "Timestamp (ISO)", kind: "meta", numeric: false },
  { id: "date", header: "Date", kind: "meta", numeric: false },
  { id: "phone", header: "Phone", kind: "meta", numeric: false },
  { id: "name", header: "Name", kind: "meta", numeric: false },
  { id: "campaign", header: "Campaign", kind: "meta", numeric: false },
];

const META_TAIL: ExportColumn[] = [
  { id: "status", header: "Call Outcome", kind: "meta", numeric: false },
  { id: "completion", header: "Completion", kind: "meta", numeric: false },
  { id: "duration", header: "Call Duration (s)", kind: "meta", numeric: true },
  { id: "source", header: "Data Source", kind: "meta", numeric: false },
];

export function buildExportColumns(fields: DataField[], opts: ExportOptions = {}): ExportColumn[] {
  const taken = new Set([...META_HEAD, ...META_TAIL].map((c) => c.header.toLowerCase()));
  const fieldCols: ExportColumn[] = [];
  for (const f of fields) {
    let header = f.label.trim() || f.key;
    if (taken.has(header.toLowerCase())) header = `${header} (${f.key})`;
    taken.add(header.toLowerCase());
    fieldCols.push({
      id: `field:${f.key}`,
      header,
      kind: "field",
      numeric: f.type === "number" || f.type === "rating",
    });
    if (opts.includeRaw)
      fieldCols.push({
        id: `raw:${f.key}`,
        header: `${header} (raw)`,
        kind: "raw",
        numeric: false,
      });
  }
  return [...META_HEAD, ...fieldCols, ...META_TAIL];
}

export const SOURCE_LABEL: Record<CallResult["source"], string> = {
  runtime: "Live call",
  test: "Test call",
  sample: "Sample (not live)",
};

export function buildExportRows(
  fields: DataField[],
  results: CallResult[],
  opts: ExportOptions = {},
): { columns: ExportColumn[]; rows: Cell[][] } {
  const columns = buildExportColumns(fields, opts);
  const rows = results.map((r) => {
    const byKey = new Map(r.answers.map((a) => [a.fieldKey, a]));
    return columns.map((c): Cell => {
      if (c.kind === "field" || c.kind === "raw") {
        const key = c.id.slice(c.id.indexOf(":") + 1);
        const a = byKey.get(key);
        if (!a) return null;
        if (c.kind === "raw") return a.rawAnswer || null;
        const v = a.normalizedAnswer;
        if (c.numeric && typeof v === "number") return v;
        const s = formatValue(v);
        return s === "" ? null : s;
      }
      switch (c.id) {
        case "call_id":
          return r.callId;
        case "timestamp":
          return r.startedAt;
        case "date":
          return localDay(r.startedAt);
        case "phone":
          return r.phone;
        case "name":
          return r.contactName || null;
        case "campaign":
          return r.campaign || null;
        case "status":
          return r.status;
        case "completion":
          return COMPLETION_LABEL[completionOf(r, fields)];
        case "duration":
          return r.durationSeconds;
        case "source":
          return SOURCE_LABEL[r.source];
        default:
          return null;
      }
    });
  });
  return { columns, rows };
}

/** Prevent spreadsheet formula injection while keeping phone numbers like +91… intact. */
export function safeCell(value: string): string {
  if (/^[=@\t\r]/.test(value) || /^[+-](?![\d\s().xX-]+$)/.test(value)) return `'${value}`;
  return value;
}

export function toCsv(columns: ExportColumn[], rows: Cell[][]): string {
  const esc = (v: Cell): string => {
    if (v === null) return "";
    const s = typeof v === "number" ? String(v) : safeCell(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map((c) => esc(c.header)).join(","),
    ...rows.map((r) => r.map(esc).join(",")),
  ];
  // BOM so Excel opens UTF-8 (Telugu / Hindi text) correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function exportFilename(
  employeeName: string,
  ext: "csv" | "xlsx",
  now: Date = new Date(),
): string {
  const slug =
    employeeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "employee";
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `${slug}-results-${d}.${ext}`;
}

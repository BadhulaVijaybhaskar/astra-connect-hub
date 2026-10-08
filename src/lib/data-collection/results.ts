import { completionOf, type Completion } from "./analytics";
import { formatValue } from "./normalize";
import type { CallResult, CallStatus, DataField } from "./types";

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const time = d
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();
  return `${date}, ${time}`;
}

/** Calendar day in the viewer's local time zone (YYYY-MM-DD). */
export function localDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDuration(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export interface ResultsFilterState {
  query: string;
  statuses: CallStatus[];
  from: string;
  to: string;
  campaign: string;
  completion: Completion | "all";
  requiredComplete: boolean;
}

export const EMPTY_FILTERS: ResultsFilterState = {
  query: "",
  statuses: [],
  from: "",
  to: "",
  campaign: "all",
  completion: "all",
  requiredComplete: false,
};

export function filterResults(
  results: CallResult[],
  fields: DataField[],
  f: ResultsFilterState,
): CallResult[] {
  const q = f.query.trim().toLowerCase();
  return results.filter((r) => {
    if (f.statuses.length && !f.statuses.includes(r.status)) return false;
    const day = localDay(r.startedAt);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (f.campaign !== "all" && r.campaign !== f.campaign) return false;
    const c = completionOf(r, fields);
    if (f.completion !== "all" && c !== f.completion) return false;
    if (f.requiredComplete && c !== "complete") return false;
    if (q) {
      const hay = [
        r.contactName,
        r.phone,
        r.callId,
        ...r.answers.map((a) => `${formatValue(a.normalizedAnswer)} ${a.rawAnswer}`),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Natural answer normalization: free speech -> structured value.
 * The raw answer is always kept alongside (raw_answer + normalized_answer).
 * An unmatched answer normalizes to null; it never invents a value.
 */
import { PREFER_NOT_TO_ANSWER } from "./fields";
import type { DataField, NormalizedValue } from "./types";

const REFUSAL = [
  /prefer not/,
  /rather not/,
  /(don'?t|do not|dont) (want|wish) to (say|answer|tell|share)/,
  /(won'?t|will not) (say|answer|tell)/,
  /no comments?\b/,
  /\bskip\b/,
  /not comfortable/,
  /it'?s (private|personal)/,
];

const SYNONYMS: Record<string, RegExp[]> = {
  undecided: [
    /\bundecided\b/,
    /(haven'?t|have not|not yet|yet to) (decided|decide)/,
    /not (decided|sure)/,
    /(don'?t|do not|dont) know/,
    /can'?t say/,
    /\bconfused\b/,
    /still thinking/,
    /no idea/,
  ],
  none: [/\bnone\b/, /\bnobody\b/, /\bno ?one\b/, /no candidate/, /nothing like that/, /\bno\b$/],
  "not sure": [/not sure/, /(don'?t|do not) know/, /\bmaybe\b/],
  "no issues": [
    /no (issue|issues|problem|problems)/,
    /nothing (went )?wrong/,
    /all (good|fine)/,
    /everything was (good|fine|great)/,
  ],
  "no leaning": [/no (leaning|one)/, /\bnobody\b/, /not leaning/],
};

const YES =
  /^(yes|yeah|yep|yup|ya|haan|ha|han|sure|definitely|of course|correct|right|ok|okay|absolutely|i am|i do|i will)\b/;
const NO = /^(no|nope|nah|nahi|nahin|not really|never|i am not|i don'?t|i won'?t)\b/;

const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

function clean(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[“”"’]/g, (m) => (m === "’" ? "'" : ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function isRefusal(raw: string): boolean {
  const t = clean(raw);
  return REFUSAL.some((r) => r.test(t));
}

export function parseNumber(raw: string): number | null {
  const t = clean(raw).replace(/,/g, "");
  const digits = t.match(/-?\d+(\.\d+)?/);
  if (digits) return Number(digits[0]);
  const words = t.split(/[\s-]+/);
  let total: number | null = null;
  for (const w of words) {
    const n = WORD_NUMBERS[w];
    if (n !== undefined) total = (total ?? 0) + n;
    else if (w === "hundred" && total !== null) total *= 100;
    else if (total !== null && w !== "and") break;
  }
  return total;
}

export function parseBoolean(raw: string): boolean | null {
  const t = clean(raw).replace(/^(uh|um|well|actually),? /, "");
  if (NO.test(t)) return false;
  if (YES.test(t)) return true;
  return null;
}

function matchOption(raw: string, options: string[]): string | null {
  const t = clean(raw);
  if (!t) return null;
  // 1. exact (case-insensitive)
  const exact = options.find((o) => clean(o) === t);
  if (exact) return exact;
  // 2. option label mentioned inside the sentence (longest first)
  const byLength = options.slice().sort((a, b) => b.length - a.length);
  for (const o of byLength) {
    const c = clean(o);
    if (c === "other") continue;
    if (
      c.length > 1 &&
      new RegExp(`(^|[^a-z0-9])${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(t)
    )
      return o;
  }
  // 3. synonym groups for well-known options
  for (const o of options) {
    const syn = SYNONYMS[clean(o)];
    if (syn?.some((r) => r.test(t))) return o;
  }
  // 4. numeric options ("1", "2", "4+")
  const n = parseNumber(t);
  if (n !== null) {
    const numeric = options.find((o) => parseNumber(o) === n);
    if (numeric) return numeric;
    const plus = options.find((o) => /\+$/.test(o) && n >= (parseNumber(o) ?? Infinity));
    if (plus) return plus;
  }
  // 5. yes/no style options
  const b = parseBoolean(t);
  if (b !== null) {
    const yn = options.find((o) => clean(o) === (b ? "yes" : "no"));
    if (yn) return yn;
  }
  return null;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(raw: string, today: Date = new Date()): string | null {
  const t = clean(raw);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isoMatch = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch)
    return iso(new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  const dmy = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
  if (dmy) {
    const yr = Number(dmy[3]);
    return iso(new Date(yr < 100 ? 2000 + yr : yr, Number(dmy[2]) - 1, Number(dmy[1])));
  }
  if (/\bday after tomorrow\b/.test(t)) return iso(new Date(base.getTime() + 2 * 864e5));
  if (/\btomorrow\b/.test(t)) return iso(new Date(base.getTime() + 864e5));
  if (/\btoday\b/.test(t)) return iso(base);
  for (let i = 0; i < MONTHS.length; i++) {
    const mon = MONTHS[i] ?? "";
    const re1 = new RegExp(`\\b(\\d{1,2})(st|nd|rd|th)? (of )?${mon}[a-z]*\\b`);
    const re2 = new RegExp(`\\b${mon}[a-z]* (\\d{1,2})(st|nd|rd|th)?\\b`);
    const m = t.match(re1) ?? t.match(re2);
    if (m) {
      const day = Number(m[1]);
      let d = new Date(base.getFullYear(), i, day);
      if (d < base) d = new Date(base.getFullYear() + 1, i, day);
      return iso(d);
    }
  }
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (t.includes(WEEKDAYS[i] ?? "~")) {
      let delta = (i - base.getDay() + 7) % 7;
      if (delta === 0 || /\bnext\b/.test(t)) delta = delta === 0 ? 7 : delta;
      return iso(new Date(base.getTime() + delta * 864e5));
    }
  }
  return null;
}

export function normalizePhone(raw: string): string | null {
  const plus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return plus ? `+${digits}` : digits;
}

export function normalizeEmail(raw: string): string | null {
  const t = clean(raw)
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+dot\s+/g, ".")
    .replace(/\s+/g, "");
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(t) ? t : null;
}

export function normalizeAnswer(
  field: Pick<DataField, "type" | "options">,
  raw: string,
  today: Date = new Date(),
): NormalizedValue {
  const text = raw.trim();
  if (!text) return null;
  if (isRefusal(text)) {
    const opt = field.options.find((o) => o === PREFER_NOT_TO_ANSWER);
    return opt ?? PREFER_NOT_TO_ANSWER;
  }
  switch (field.type) {
    case "single_select": {
      const m = matchOption(text, field.options);
      if (m) return m;
      return field.options.includes("Other") ? "Other" : null;
    }
    case "multi_select": {
      const parts = text
        .split(/,|;|\band\b|&|\//)
        .map((p) => p.trim())
        .filter(Boolean);
      const found: string[] = [];
      for (const p of [text, ...parts]) {
        for (const o of field.options) {
          if (found.includes(o)) continue;
          if (matchOption(p, [o]) === o) found.push(o);
        }
      }
      return found.length ? field.options.filter((o) => found.includes(o)) : null;
    }
    case "boolean":
      return parseBoolean(text);
    case "rating": {
      const n = parseNumber(text);
      if (n === null) return null;
      const r = Math.round(n);
      return r >= 1 && r <= 5 ? r : null;
    }
    case "number":
      return parseNumber(text);
    case "phone":
      return normalizePhone(text);
    case "email":
      return normalizeEmail(text);
    case "date":
      return parseDate(text, today);
    case "text":
    case "long_text":
      return text;
    default:
      return text;
  }
}

/** Human/flat representation used by tables and exports. */
export function formatValue(value: NormalizedValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

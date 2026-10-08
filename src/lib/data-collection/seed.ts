/**
 * Sample (seeded) results so the Results / Analytics / Export surfaces can be
 * demonstrated before any live call. Every row has source = "sample" and is
 * labelled "Sample (not live)" in the UI and in exports.
 */
import { shouldAsk } from "./conditions";
import { normalizeAnswer } from "./normalize";
import type { CallAnswer, CallResult, CallStatus, DataField, NormalizedValue } from "./types";

const TEXT_SAMPLES: Record<string, string[]> = {
  constituency: ["Jubilee Hills", "Kukatpally", "Madhapur", "Serilingampally", "Khairatabad"],
  location: ["Ameerpet", "Gachibowli", "Kondapur", "Miyapur", "Begumpet"],
  location_preference: ["Gachibowli", "Kokapet", "Tellapur", "Kompally"],
  current_location: ["Hyderabad", "Bengaluru", "Pune", "Chennai"],
  company: ["Sri Sai Traders", "Nova Interiors", "BlueLeaf Clinics", "Metro Realty"],
  full_name: ["Ravi", "Sravani", "Imran", "Lakshmi", "Arjun"],
  patient_name: ["Ravi", "Sravani", "Imran", "Lakshmi", "Arjun"],
  budget: ["around 80 lakhs", "1 to 1.2 crore", "about 50,000 a month", "not decided yet"],
  expected_salary: ["18 LPA", "around 12 lakhs", "25 LPA"],
  account_id: ["ORD-48211", "ACC-1093", "ORD-55120"],
  support_reason: [
    "Mainly because of the work done on roads in our area.",
    "He is available whenever we need him.",
    "Their focus on jobs for young people.",
  ],
  rejection_reason: [
    "They have not done anything for water supply.",
    "Too many promises, nothing on the ground.",
    "I don't trust their local leaders.",
  ],
  requirement: [
    "Looking to automate follow-ups for our inbound leads.",
    "Need help qualifying website enquiries quickly.",
  ],
  issue_description: ["The delivery was late by two days.", "I was charged twice this month."],
  issue_details: ["The delivery was late by two days.", "Staff did not call back as promised."],
  escalation_reason: ["Please call after 6 PM, I need the refund status."],
  appointment_reason: [
    "Need a quick check-up for knee pain.",
    "Follow-up visit after last week's tests.",
  ],
  preference_reason: ["It is simpler to use.", "Better value for money."],
  comments: [
    "Nothing more, thank you.",
    "Please call in the evening next time.",
    "Good that you are asking people.",
  ],
  open_feedback: ["Nothing more, thank you.", "Keep the call short."],
};

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, list: T[]): T {
  return list[Math.floor(r() * list.length)] as T;
}

function rawFor(f: DataField, r: () => number): string {
  switch (f.type) {
    case "single_select": {
      const o = pick(r, f.options);
      if (o === "Undecided") return "Honestly I haven't decided yet";
      if (o === "Prefer not to answer") return "I'd rather not say";
      if (o === "None") return "No one like that";
      return `I'd say ${o}`;
    }
    case "multi_select": {
      const a = pick(r, f.options);
      const b = pick(r, f.options);
      return a === b ? a : `${a} and ${b}`;
    }
    case "boolean":
      return r() > 0.4 ? "Yes, sure" : "No, not really";
    case "rating":
      return `${1 + Math.floor(r() * 5)} out of 5`;
    case "number":
      return `${1 + Math.floor(r() * 12)}`;
    case "phone":
      return "98xxx x" + String(1000 + Math.floor(r() * 8999));
    case "email":
      return "sample.respondent at example dot com";
    case "date":
      return pick(r, ["tomorrow", "this Saturday", "next Monday"]);
    default:
      return pick(r, TEXT_SAMPLES[f.key] ?? ["Sample answer"]);
  }
}

export function buildSampleResults(
  employeeId: string,
  fields: DataField[],
  count = 12,
  now: Date = new Date(),
): CallResult[] {
  const r = rng(employeeId);
  const out: CallResult[] = [];
  for (let i = 0; i < count; i++) {
    const roll = r();
    const status: CallStatus =
      roll < 0.08
        ? "No answer"
        : roll < 0.14
          ? "Not interested"
          : roll < 0.22
            ? "Callback"
            : "Completed";
    const answers: CallAnswer[] = [];
    const map: Record<string, NormalizedValue> = {};
    if (status === "Completed" || status === "Callback") {
      const partial = status === "Callback";
      fields.forEach((f, idx) => {
        if (f.source !== "ask" || !shouldAsk(f, map)) return;
        if (partial && idx > 2) return;
        if (!f.required && r() < 0.15) return;
        let raw = rawFor(f, r);
        let normalized = normalizeAnswer(f, raw, now);
        // Keep sample surveys coherent: nobody rejects the candidate they support.
        if (f.key === "candidate_rejection" && normalized === map["candidate_support"]) {
          raw = "No one like that";
          normalized = normalizeAnswer(f, raw, now);
        }
        map[f.key] = normalized;
        answers.push({ fieldKey: f.key, rawAnswer: raw, normalizedAnswer: normalized });
      });
    }
    const started = new Date(now.getTime() - (i * 47 + Math.floor(r() * 30)) * 60_000);
    const n = String(i + 1).padStart(4, "0");
    out.push({
      id: `sample_${employeeId}_${n}`,
      employeeId,
      callId: `SAMPLE-${n}`,
      contactName: `Sample respondent ${i + 1}`,
      phone: `+91 9xxxx x${String(1000 + Math.floor(r() * 8999))}`,
      status,
      startedAt: started.toISOString(),
      durationSeconds: status === "No answer" ? 0 : 40 + Math.floor(r() * 200),
      answers,
      transcript:
        status === "No answer"
          ? ""
          : answers.map((a) => `Respondent: ${a.rawAnswer}`).join("\n") ||
            "Respondent declined to continue.",
      summary: `Sample row generated for demo purposes (${status}). Not a live call.`,
      recordingUrl: null,
      source: "sample",
      campaign: "Sample data",
    });
  }
  return out;
}

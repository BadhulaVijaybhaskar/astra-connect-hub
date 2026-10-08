import { describe, expect, test } from "bun:test";
import { computeAnalytics, completionOf } from "../../src/lib/data-collection/analytics";
import { fieldsToAsk, shouldAsk } from "../../src/lib/data-collection/conditions";
import { blankDraft } from "../../src/lib/data-collection/draft";
import { PREFER_NOT_TO_ANSWER } from "../../src/lib/data-collection/fields";
import { buildSampleResults } from "../../src/lib/data-collection/seed";
import {
  defaultAnswers,
  detectVertical,
  missingFieldMentions,
  templateSetupGenerator,
  type SetupContext,
} from "../../src/lib/data-collection/setup-engine";
import { stepIssues } from "../../src/lib/data-collection/wizard";

const ctx = (purpose: string): SetupContext => {
  const vertical = detectVertical(purpose);
  return {
    name: "Priya",
    role: "Survey agent",
    brand: "Astra Voice",
    purpose,
    goal: "",
    direction: "outbound",
    vertical,
  };
};

describe("vertical detection", () => {
  test.each([
    ["I want to conduct a political survey about which candidate voters support", "politics"],
    ["Qualify inbound leads and send hot leads to my sales team", "sales"],
    ["Ask buyers about budget, location and property type, book site visits", "real_estate"],
    ["Book patient appointments for the clinic", "healthcare"],
    [
      "Screen candidates for experience, notice period and expected salary for hiring",
      "recruitment",
    ],
    ["Collect feedback rating after delivery", "feedback"],
    ["Collect details before creating a support ticket", "support"],
    ["Call my contacts", "general"],
  ])("%s -> %s", (purpose, vertical) => {
    expect(detectVertical(purpose)).toBe(vertical as never);
  });
});

describe("political survey generation", () => {
  const c = ctx(
    "I want this employee to call people and conduct a political survey on candidates and local issues.",
  );
  test("asks adaptive questions", async () => {
    const qs = await templateSetupGenerator.questions(c);
    expect(qs.map((q) => q.id)).toEqual([
      "audience",
      "collect",
      "options",
      "mandatory",
      "followups",
      "after",
    ]);
    expect(qs.find((q) => q.id === "options")?.question).toContain("candidates");
  });

  test("generates neutral fields with candidate options + Prefer not to answer", async () => {
    const answers = defaultAnswers(c).map((a) =>
      a.questionId === "options"
        ? { ...a, value: "Ravi Kumar, Sita Devi, NOTA", skipped: false }
        : a,
    );
    const g = await templateSetupGenerator.generate(c, answers);
    expect(g.researchMode).toBe("neutral");
    const support = g.fields.find((f) => f.key === "candidate_support");
    expect(support?.options).toEqual([
      "Ravi Kumar",
      "Sita Devi",
      "NOTA",
      "Undecided",
      PREFER_NOT_TO_ANSWER,
    ]);
    expect(support?.required).toBe(true);
    for (const f of g.fields.filter((x) => x.type === "single_select"))
      expect(f.options).toContain(PREFER_NOT_TO_ANSWER);
    expect(g.instructions).toContain("Neutral research mode");
    expect(g.instructions).toMatch(/Never persuade/);
    expect(missingFieldMentions(g.instructions, g.fields)).toEqual([]);
    expect(g.workflowSteps.map((s) => s.label)).toContain("Conditional Follow-ups");
  });

  test("IF/THEN follow-ups", async () => {
    const g = await templateSetupGenerator.generate(c, defaultAnswers(c));
    const undecided = g.fields.find((f) => f.key === "undecided_leaning")!;
    const reason = g.fields.find((f) => f.key === "support_reason")!;
    expect(shouldAsk(undecided, { candidate_support: "Undecided" })).toBe(true);
    expect(shouldAsk(undecided, { candidate_support: "Candidate A" })).toBe(false);
    expect(shouldAsk(reason, { candidate_support: "Candidate A" })).toBe(true);
    expect(shouldAsk(reason, {})).toBe(false);
    expect(
      fieldsToAsk(g.fields, { candidate_support: "Undecided" }).some(
        (f) => f.key === "support_reason",
      ),
    ).toBe(false);
  });

  test("follow-ups disabled removes conditions", async () => {
    const answers = defaultAnswers(c).map((a) =>
      a.questionId === "followups" ? { ...a, value: false } : a,
    );
    const g = await templateSetupGenerator.generate(c, answers);
    expect(g.fields.every((f) => f.condition === null)).toBe(true);
  });
});

describe("sales lead qualifier generation", () => {
  test("qualified outcome, no neutral mode", async () => {
    const c = ctx("Qualify our 300 weekly inbound leads and send only hot leads to the sales team");
    const g = await templateSetupGenerator.generate(c, defaultAnswers(c));
    expect(g.researchMode).toBe("standard");
    expect(g.outcomes[0]?.status).toBe("Qualified");
    expect(g.fields.map((f) => f.key)).toContain("lead_temperature");
  });
});

describe("analytics + completion + wizard gates", () => {
  test("sample results are labelled and analytics compute", async () => {
    const c = ctx("political survey on candidates");
    const g = await templateSetupGenerator.generate(c, defaultAnswers(c));
    const results = buildSampleResults("emp_test", g.fields, 20, new Date(2026, 9, 9));
    expect(results.every((r) => r.source === "sample")).toBe(true);
    const a = computeAnalytics(g.fields, results);
    expect(a.totalCalls).toBe(20);
    expect(a.sampleOnly).toBe(true);
    expect(a.complete + a.partial + a.noResponse).toBe(20);
    const support = a.fields.find((f) => f.key === "candidate_support")!;
    const sum = support.distribution.reduce((n, d) => n + d.count, 0);
    expect(sum).toBe(support.answered);
    for (const r of results)
      if (r.status === "No answer") expect(completionOf(r, g.fields)).toBe("none");
  });

  test("wizard gates", () => {
    const d = blankDraft();
    expect(stepIssues("identity", d)).toContain("Name is required");
    d.name = "Priya";
    d.role = "Survey agent";
    expect(stepIssues("identity", d)).toEqual([]);
    expect(stepIssues("purpose", d).length).toBeGreaterThan(0);
    d.purpose = "Run a political opinion survey";
    expect(stepIssues("purpose", d)).toEqual([]);
    expect(stepIssues("data", d)).toContain("Add at least 1 field");
    d.workflow = { ...d.workflow, mode: "existing" };
    expect(stepIssues("workflow", d)).toContain("Select a workflow to attach");
  });
});

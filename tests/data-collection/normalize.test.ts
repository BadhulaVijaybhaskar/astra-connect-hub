import { describe, expect, test } from "bun:test";
import { PREFER_NOT_TO_ANSWER, makeField } from "../../src/lib/data-collection/fields";
import { formatValue, normalizeAnswer, parseDate } from "../../src/lib/data-collection/normalize";

const support = makeField("Candidate supported", "single_select", {
  options: ["Candidate A", "Candidate B", "Candidate C", "NOTA", "Undecided", PREFER_NOT_TO_ANSWER],
});
const rejection = makeField("Candidate rejected", "single_select", {
  options: ["Candidate A", "Candidate B", "None", PREFER_NOT_TO_ANSWER],
});

describe("normalizeAnswer", () => {
  test("maps free speech to select options", () => {
    expect(normalizeAnswer(support, "I haven't decided yet")).toBe("Undecided");
    expect(normalizeAnswer(support, "Honestly, still thinking about it")).toBe("Undecided");
    expect(normalizeAnswer(support, "I'll go with candidate b")).toBe("Candidate B");
    expect(normalizeAnswer(support, "nota")).toBe("NOTA");
    expect(normalizeAnswer(rejection, "No one like that")).toBe("None");
  });

  test("refusals become Prefer not to answer", () => {
    expect(normalizeAnswer(support, "I'd rather not say")).toBe(PREFER_NOT_TO_ANSWER);
    expect(
      normalizeAnswer(makeField("Satisfaction", "rating"), "I don't want to answer that"),
    ).toBe(PREFER_NOT_TO_ANSWER);
  });

  test("unmatched select answers normalize to null (never invented)", () => {
    expect(normalizeAnswer(support, "the weather is nice")).toBeNull();
    const withOther = makeField("Issue", "single_select", { options: ["Roads", "Water", "Other"] });
    expect(normalizeAnswer(withOther, "electricity cuts")).toBe("Other");
    expect(normalizeAnswer(withOther, "mostly the water supply")).toBe("Water");
  });

  test("multi select, boolean, rating, number", () => {
    const skills = makeField("Skills", "multi_select", { options: ["React", "Node.js", "SQL"] });
    expect(normalizeAnswer(skills, "react and sql mostly")).toEqual(["React", "SQL"]);
    expect(normalizeAnswer(makeField("Decision maker", "boolean"), "Haan, I am")).toBe(true);
    expect(normalizeAnswer(makeField("Decision maker", "boolean"), "No, my manager decides")).toBe(
      false,
    );
    expect(normalizeAnswer(makeField("Rating", "rating"), "four out of five")).toBe(4);
    expect(normalizeAnswer(makeField("Rating", "rating"), "9")).toBeNull();
    expect(normalizeAnswer(makeField("Experience", "number"), "about twenty five years")).toBe(25);
    expect(normalizeAnswer(makeField("Leads", "number"), "300 leads a week")).toBe(300);
  });

  test("phone, email, date", () => {
    expect(normalizeAnswer(makeField("Phone", "phone"), "+91 98765 43210")).toBe("+919876543210");
    expect(normalizeAnswer(makeField("Email", "email"), "ravi at example dot com")).toBe(
      "ravi@example.com",
    );
    const today = new Date(2026, 9, 9); // Fri 9 Oct 2026
    expect(parseDate("tomorrow", today)).toBe("2026-10-10");
    expect(parseDate("next Monday", today)).toBe("2026-10-12");
    expect(parseDate("15th October", today)).toBe("2026-10-15");
    expect(parseDate("12/11/2026", today)).toBe("2026-11-12");
  });

  test("formatValue flattens for tables and exports", () => {
    expect(formatValue(["React", "SQL"])).toBe("React; SQL");
    expect(formatValue(true)).toBe("Yes");
    expect(formatValue(null)).toBe("");
    expect(formatValue(3)).toBe("3");
  });
});

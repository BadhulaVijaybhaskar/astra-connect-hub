import { describe, expect, test } from "bun:test";
import { makeField } from "../../src/lib/data-collection/fields";
import {
  buildExportColumns,
  buildExportRows,
  exportFilename,
  safeCell,
  toCsv,
} from "../../src/lib/data-collection/export";
import type { CallResult } from "../../src/lib/data-collection/types";
import { buildXlsx, columnLetter } from "../../src/lib/data-collection/xlsx";

const fields = [
  makeField("Constituency", "text", { required: true }),
  makeField("Candidate supported", "single_select", {
    options: ["A", "B", "Undecided"],
    required: true,
  }),
  makeField("Government satisfaction", "rating"),
  makeField("Skills", "multi_select", { options: ["X", "Y"] }),
  makeField("Name", "text", { key: "full_name" }),
];

const result: CallResult = {
  id: "r1",
  employeeId: "e1",
  callId: "CALL-1",
  contactName: "Ravi",
  phone: "+919876543210",
  status: "Completed",
  startedAt: "2026-10-08T20:00:00.000Z",
  durationSeconds: 125,
  answers: [
    {
      fieldKey: "constituency",
      rawAnswer: "Jubilee Hills, sir",
      normalizedAnswer: "Jubilee Hills",
    },
    {
      fieldKey: "candidate_supported",
      rawAnswer: "haven't decided",
      normalizedAnswer: "Undecided",
    },
    { fieldKey: "government_satisfaction", rawAnswer: "three", normalizedAnswer: 3 },
    { fieldKey: "skills", rawAnswer: "x and y", normalizedAnswer: ["X", "Y"] },
  ],
  transcript: "",
  summary: "",
  recordingUrl: null,
  source: "sample",
  campaign: "Oct wave",
};

describe("export column mapping", () => {
  test("one field = one column, flanked by flat meta columns, no JSON column", () => {
    const cols = buildExportColumns(fields);
    expect(cols.map((c) => c.header)).toEqual([
      "Call ID",
      "Timestamp (ISO)",
      "Date",
      "Phone",
      "Name",
      "Campaign",
      "Constituency",
      "Candidate supported",
      "Government satisfaction",
      "Skills",
      "Name (full_name)",
      "Call Outcome",
      "Completion",
      "Call Duration (s)",
      "Data Source",
    ]);
    expect(cols.some((c) => /json|answers/i.test(c.header))).toBe(false);
  });

  test("rows are flat, numbers stay numeric, sample rows are labelled", () => {
    const { columns, rows } = buildExportRows(fields, [result]);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    const get = (h: string) => row[columns.findIndex((c) => c.header === h)];
    expect(get("Candidate supported")).toBe("Undecided");
    expect(get("Government satisfaction")).toBe(3);
    expect(get("Skills")).toBe("X; Y");
    expect(get("Name (full_name)")).toBeNull();
    expect(get("Call Duration (s)")).toBe(125);
    expect(get("Completion")).toBe("Complete");
    expect(get("Data Source")).toBe("Sample (not live)");
    for (const cell of row) expect(typeof cell === "object" && cell !== null).toBe(false);
  });

  test("raw answers are optional extra columns", () => {
    const { columns, rows } = buildExportRows(fields, [result], { includeRaw: true });
    const i = columns.findIndex((c) => c.header === "Constituency (raw)");
    expect(i).toBeGreaterThan(-1);
    expect(rows[0]![i]).toBe("Jubilee Hills, sir");
  });

  test("CSV quoting, BOM and formula-injection guard", () => {
    const csv = toCsv(buildExportColumns([]), [
      [
        "a,b",
        'say "hi"',
        null,
        "+919876543210",
        "=SUM(A1)",
        null,
        "Completed",
        "Complete",
        5,
        "Live call",
      ],
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"say ""hi"""');
    expect(csv).toContain(",+919876543210,");
    expect(csv).toContain(",'=SUM(A1),");
    expect(safeCell("-5")).toBe("-5");
    expect(safeCell("@cmd")).toBe("'@cmd");
  });

  test("filename", () => {
    expect(exportFilename("Public Opinion Agent", "xlsx", new Date(2026, 9, 9))).toBe(
      "public-opinion-agent-results-2026-10-09.xlsx",
    );
  });
});

describe("xlsx writer", () => {
  test("column letters", () => {
    expect(columnLetter(0)).toBe("A");
    expect(columnLetter(25)).toBe("Z");
    expect(columnLetter(26)).toBe("AA");
    expect(columnLetter(701)).toBe("ZZ");
  });

  test("produces a zip with the required OOXML parts", () => {
    const { columns, rows } = buildExportRows(fields, [result]);
    const bytes = buildXlsx(columns, rows);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const text = new TextDecoder().decode(bytes);
    for (const part of [
      "[Content_Types].xml",
      "xl/workbook.xml",
      "xl/worksheets/sheet1.xml",
      "xl/styles.xml",
    ])
      expect(text).toContain(part);
    expect(text).toContain("<v>125</v>");
    expect(text).toContain("Jubilee Hills");
  });
});

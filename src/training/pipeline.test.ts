// src/training/pipeline.test.ts - pure tests for the training-corpus pipeline.
// Covers: CSV parsing, license gate, label mapping, Rejects sanitization,
// dedupe, and deterministic balancing. No network, no I/O.

import { describe, expect, it } from "vitest";
import {
  ALLOWED_LICENSES,
  assertLicenseAllowed,
  balanceRows,
  dedupe,
  dedupeKey,
  mapRow,
  parseCsv,
  resolveColumns,
  TrainingRow,
} from "./pipeline";
import { getSource, TRAINING_SOURCES } from "./sources";

describe("parseCsv", () => {
  it("handles quoted fields with embedded commas", () => {
    const rows = parseCsv('a,b\n"x,y",z\n');
    expect(rows).toEqual([
      ["a", "b"],
      ["x,y", "z"],
    ]);
  });

  it("handles embedded newlines and escaped quotes inside quoted fields", () => {
    const rows = parseCsv('a,b\n"line1\nline2 ""quoted""",2\n');
    expect(rows).toEqual([
      ["a", "b"],
      ['line1\nline2 "quoted"', "2"],
    ]);
  });

  it("strips a leading BOM and handles CRLF", () => {
    const rows = parseCsv("\uFEFFa,b\r\n1,2\r\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("drops fully-empty trailing rows", () => {
    const rows = parseCsv("a,b\n1,2\n\n\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("license gate", () => {
  it("allows only permissive licenses", () => {
    expect(ALLOWED_LICENSES.has("apache-2.0")).toBe(true);
    expect(ALLOWED_LICENSES.has("mit")).toBe(true);
    expect(ALLOWED_LICENSES.has("cc-by-4.0")).toBe(true);
    expect(ALLOWED_LICENSES.has("cc0-1.0")).toBe(true);
    expect(ALLOWED_LICENSES.has("lgpl-3.0")).toBe(false);
    expect(ALLOWED_LICENSES.has("other")).toBe(false);
    expect(ALLOWED_LICENSES.has("unknown")).toBe(false);
    expect(ALLOWED_LICENSES.has("none")).toBe(false);
  });

  it("throws on a non-permissive license", () => {
    expect(() => assertLicenseAllowed("lgpl-3.0", "test")).toThrow(/LICENSE GATE/);
    expect(() => assertLicenseAllowed("apache-2.0", "test")).not.toThrow();
  });

  it("blocks non-commercial licenses unless explicitly opted-in", () => {
    expect(() => assertLicenseAllowed("cc-by-nc-sa-4.0", "test")).toThrow(/LICENSE GATE/);
    expect(() => assertLicenseAllowed("cc-by-nc-sa-4.0", "test", { nonCommercial: true })).not.toThrow();
  });

  it("every registered source passes the gate (incl. owner-approved non-commercial)", () => {
    for (const s of TRAINING_SOURCES) {
      expect(() => assertLicenseAllowed(s.license, s.id, { nonCommercial: s.nonCommercial })).not.toThrow();
    }
  });
});

describe("resolveColumns + mapRow", () => {
  it("maps labels and applies the Rejects layer", () => {
    const header = ["content", "label"];
    const cols = resolveColumns(header, { text: "content", label: "label" });
    const row = mapRow(
      ["Call 09171234567 now, send OTP 123456", "1"],
      0,
      {
        source: "test",
        license: "apache-2.0",
        channel: "email",
        labelMap: { "1": "SCAM", "0": "LEGIT" },
        columns: cols,
      }
    );
    expect(row.label).toBe("SCAM");
    expect(row.redacted).toBe(true);
    expect(row.text).not.toContain("09171234567");
    expect(row.text).toContain("[REDACTED:MOBILE]");
  });

  it("labels every row via constantLabel when the CSV has no label column", () => {
    const src = getSource("kaggle-ph-spam");
    // Header has no label column (text, masked/hashed numbers, date, carrier).
    const cols = resolveColumns(["masked_celphone_number", "hashed_cellphone_number", "date", "text", "carrier"], src.columns);
    const row = mapRow(
      ["+63969****493", "uuid", "2026-07-01", "Login at may 2 FREE Spin! 789bingo.com", "<unknown>"],
      0,
      { source: src.id, license: src.license, channel: src.channel, labelMap: src.labelMap, columns: cols, constantLabel: src.constantLabel }
    );
    expect(row.label).toBe("SCAM");
    expect(row.channel).toBe("sms");
  });

  it("maps the scamshield source column to a channel", () => {
    const src = getSource("scamshield");
    const cols = resolveColumns(["text", "label", "source"], src.columns);
    const row = mapRow(
      ["We are hiring, send your CV to resume@x.com", "0", "job"],
      1,
      { source: src.id, license: src.license, channel: src.channel, labelMap: src.labelMap, columns: cols }
    );
    expect(row.channel).toBe("job");
    expect(row.label).toBe("LEGIT");
  });

  it("throws on an unmapped label instead of silently mislabeling", () => {
    const cols = resolveColumns(["message", "label"], { text: "message", label: "label" });
    expect(() =>
      mapRow(["hello", "ham"], 0, {
        source: "test",
        license: "mit",
        channel: "sms",
        labelMap: { spam: "SCAM", ham: "LEGIT" },
        columns: cols,
      })
    ).not.toThrow();
    expect(() =>
      mapRow(["hello", "ham"], 0, {
        source: "test",
        license: "mit",
        channel: "sms",
        labelMap: { spam: "SCAM" },
        columns: cols,
      })
    ).toThrow(/unmapped label/);
  });

  it("rejects an invalid channel from a channel mapper", () => {
    const cols = resolveColumns(["text", "label", "source"], { text: "text", label: "label", channel: "source" });
    expect(() =>
      mapRow(["text", "0", "unknown"], 0, {
        source: "test",
        license: "mit",
        channel: () => "unknown" as "sms",
        labelMap: { "0": "LEGIT", "1": "SCAM" },
        columns: cols,
      })
    ).toThrow(/channel mapper returned "unknown"/);
  });
});

describe("dedupe", () => {
  it("collapses rows whose text differs only by case/whitespace/punctuation", () => {
    const mk = (id: string, text: string): TrainingRow => ({
      id,
      text,
      label: "SCAM",
      channel: "sms",
      source: "test",
      license: "mit",
      originalIndex: 0,
      redacted: false,
      redactedCategories: [],
    });
    const rows = [
      mk("a", "WINNER! Claim your prize now!"),
      mk("b", "  winner! claim your prize now!! "),
      mk("c", "a completely different message"),
    ];
    const out = dedupe(rows);
    expect(out.map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("dedupeKey is stable and length-bounded", () => {
    const a = dedupeKey("Hello   World");
    const b = dedupeKey("hello world");
    expect(a).toBe(b);
    expect(a.length).toBe(64);
  });
});

describe("balanceRows", () => {
  const mk = (id: string, label: "SCAM" | "LEGIT"): TrainingRow => ({
    id,
    text: id,
    label,
    channel: "sms",
    source: "test",
    license: "mit",
    originalIndex: 0,
    redacted: false,
    redactedCategories: [],
  });

  it("downsamples the majority to maxMajorityRatio x minority, keeping all minority", () => {
    const rows = [
      ...Array.from({ length: 100 }, (_, i) => mk(`legit-${i}`, "LEGIT")),
      ...Array.from({ length: 10 }, (_, i) => mk(`scam-${i}`, "SCAM")),
    ];
    const out = balanceRows(rows, 2, 42);
    expect(out.filter((r) => r.label === "SCAM").length).toBe(10);
    expect(out.filter((r) => r.label === "LEGIT").length).toBe(20);
    expect(out.length).toBe(30);
  });

  it("is deterministic for a fixed seed", () => {
    const rows = [
      ...Array.from({ length: 50 }, (_, i) => mk(`legit-${i}`, "LEGIT")),
      ...Array.from({ length: 5 }, (_, i) => mk(`scam-${i}`, "SCAM")),
    ];
    const a = balanceRows(rows, 2, 7).map((r) => r.id).join(",");
    const b = balanceRows(rows, 2, 7).map((r) => r.id).join(",");
    expect(a).toBe(b);
  });

  it("returns rows unchanged when already balanced", () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => mk(`legit-${i}`, "LEGIT")),
      ...Array.from({ length: 10 }, (_, i) => mk(`scam-${i}`, "SCAM")),
    ];
    expect(balanceRows(rows, 2, 1).length).toBe(20);
  });

  it("does nothing when one class is empty", () => {
    const rows = [mk("a", "LEGIT"), mk("b", "LEGIT")];
    expect(balanceRows(rows, 2, 1).length).toBe(2);
  });
});

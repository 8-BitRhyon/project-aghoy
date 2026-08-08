// src/training/pipeline.ts - pure data-pipeline logic for the Aghoy training
// corpus. No I/O, no fetch: everything here is testable in isolation and is
// consumed by scripts/import-datasets.ts.
//
// Pipeline stages:
//   parseCsv   -> row objects (RFC-4180-ish, tolerant of quoted newlines)
//   mapRow     -> { text, label, channel } via a DatasetSource config
//   sanitize   -> every text passes through the authoritative Rejects layer
//                 (src/rejects/rejects.ts) so training matches production:
//                 a classifier must never learn to key on raw numbers/emails,
//                 because production sees only [REDACTED:*] placeholders.
//   dedupe     -> normalized-content hash, first-seen wins
//   emit       -> one JSONL line per TrainingRow

import { createHash } from "node:crypto";
import { redactPII } from "../rejects/rejects";

export type TrainingLabel = "SCAM" | "LEGIT";
export type TrainingChannel = "email" | "sms" | "job";

export interface TrainingRow {
  id: string;
  text: string; // Rejects-sanitized
  label: TrainingLabel;
  channel: TrainingChannel;
  source: string;
  license: string;
  originalIndex: number;
  redacted: boolean;
  redactedCategories: string[];
}

// License allowlist. Anything else (LGPL, GPL, OpenRAIL, `other`, `unknown`,
// `none`) hard-blocks the import. Only permissive, redistribute-friendly
// licenses may enter the Aghoy training corpus.
export const ALLOWED_LICENSES = new Set(["apache-2.0", "mit", "cc-by-4.0", "cc0-1.0"]);

// Non-commercial exceptions: licenses whose ShareAlike/NonCommercial terms
// restrict redistribution, admitted ONLY on an explicit owner decision
// (recorded in the source's `licenseNote`). These do NOT go in ALLOWED_LICENSES
// so the default gate stays strict; a source opts in via `nonCommercial: true`.
export const ALLOWED_NONCOMMERCIAL_LICENSES = new Set(["cc-by-nc-sa-4.0"]);

export const assertLicenseAllowed = (license: string, sourceId: string, opts: { nonCommercial?: boolean } = {}): void => {
  if (ALLOWED_LICENSES.has(license)) return;
  if (opts.nonCommercial && ALLOWED_NONCOMMERCIAL_LICENSES.has(license)) return;
  throw new Error(
    `LICENSE GATE BLOCKED: "${sourceId}" declares "${license}", which is not in ` +
      `[${[...ALLOWED_LICENSES].join(", ")}] and not an approved non-commercial exception ` +
      `([${[...ALLOWED_NONCOMMERCIAL_LICENSES].join(", ")}]). Aghoy only trains on permissive licenses.`
  );
};

// Minimal RFC-4180-ish CSV parser. Handles:
//   - quoted fields containing commas and embedded newlines
//   - escaped quotes ("" inside a quoted field)
//   - a leading BOM on the first header cell
//   - \r\n and \n line endings
export const parseCsv = (raw: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const text = raw.replace(/^\uFEFF/, "");
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

export interface CsvColumns {
  text: string;
  label: string;
  channel?: string;
}

// Map a header row to column indices. Throws if a required column is missing.
// `label` is optional ONLY for constant-label sources (which pass a label
// column name that is never read); resolveColumns returns -1 and the caller
// supplies the label via constantLabel.
export const resolveColumns = (header: string[], cols: CsvColumns): { text: number; label: number; channel: number | null } => {
  const lower = header.map((h) => h.trim().toLowerCase());
  const text = lower.indexOf(cols.text.toLowerCase());
  const label = cols.label ? lower.indexOf(cols.label.toLowerCase()) : -1;
  const channel = cols.channel ? lower.indexOf(cols.channel.toLowerCase()) : -1;
  if (text === -1) throw new Error(`CSV missing text column "${cols.text}" in header: ${header.join(",")}`);
  if (label === -1 && cols.label) {
    throw new Error(`CSV missing label column "${cols.label}" in header: ${header.join(",")}`);
  }
  return { text, label, channel: channel >= 0 ? channel : null };
};

export interface MapRowOptions {
  source: string;
  license: string;
  channel: TrainingChannel | ((value: string) => TrainingChannel);
  // Maps raw label cell values to the canonical training label.
  labelMap: Record<string, TrainingLabel>;
  columns: { text: number; label: number; channel: number | null };
  // When set, every row gets this label regardless of the label column. Used
  // by datasets that ship only one class (e.g. a scam-only SMS collection).
  constantLabel?: TrainingLabel;
}

// Build a TrainingRow from one parsed CSV row. Applies the Rejects layer to
// the text and canonicalizes label/channel. Throws on an unmapped label so a
// typo'd or unexpected class surfaces immediately instead of silently
// corrupting the corpus.
export const mapRow = (raw: string[], index: number, opts: MapRowOptions): TrainingRow => {
  const rawText = (raw[opts.columns.text] ?? "").trim();
  const rawLabel = opts.constantLabel ?? (raw[opts.columns.label] ?? "").trim().toLowerCase();
  const label = opts.constantLabel ?? opts.labelMap[rawLabel];
  if (label === undefined) {
    throw new Error(`source "${opts.source}" row ${index}: unmapped label "${rawLabel}"`);
  }
  const rawChannelValue =
    typeof opts.channel === "function" && opts.columns.channel !== null
      ? opts.channel((raw[opts.columns.channel] ?? "").trim().toLowerCase())
      : (opts.channel as TrainingChannel);
  // Runtime-validate the channel mapper's output so a buggy/unknown source
  // value cannot silently corrupt the corpus with an invalid channel.
  if (!["email", "sms", "job"].includes(rawChannelValue)) {
    throw new Error(`source "${opts.source}" row ${index}: channel mapper returned "${rawChannelValue}"`);
  }
  const channel: TrainingChannel = rawChannelValue;

  const rejected = redactPII(rawText);
  return {
    id: `${opts.source}-${String(index).padStart(6, "0")}`,
    text: rejected.text,
    label,
    channel,
    source: opts.source,
    license: opts.license,
    originalIndex: index,
    redacted: rejected.redacted,
    redactedCategories: rejected.categories,
  };
};

// Dedupe key: lowercase + collapse whitespace + strip punctuation, so the same
// scam pasted with different punctuation/trailing text collapses to one row.
export const dedupeKey = (text: string): string => {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalized).digest("hex");
};

export const dedupe = (rows: TrainingRow[]): TrainingRow[] => {
  const seen = new Set<string>();
  const out: TrainingRow[] = [];
  for (const row of rows) {
    const key = dedupeKey(row.text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
};

// Deterministic (seeded) downsampling of the majority class so a classifier
// sees a balanced corpus. Keeps ALL minority rows; samples the majority down
// to `maxMajorityRatio * minorityCount`. Seeded so reruns are stable.
const mulberry32 = (seed: number): () => number => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const balanceRows = (rows: TrainingRow[], maxMajorityRatio = 2, seed = 20260807): TrainingRow[] => {
  const scam = rows.filter((r) => r.label === "SCAM");
  const legit = rows.filter((r) => r.label === "LEGIT");
  if (scam.length === 0 || legit.length === 0) return rows;
  const [majority, minority] = scam.length >= legit.length ? [scam, legit] : [legit, scam];
  const keep = Math.min(majority.length, minority.length * maxMajorityRatio);
  if (keep >= majority.length) return rows;
  const rng = mulberry32(seed);
  const shuffled = [...majority];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const keptMajority = shuffled.slice(0, keep);
  return scam.length >= legit.length ? [...keptMajority, ...legit] : [...keptMajority, ...scam];
};

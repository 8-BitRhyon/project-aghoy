// scripts/import-datasets.ts - builds the Aghoy training corpus from
// externally published, permissively-licensed datasets.
//
// Run: npx tsx scripts/import-datasets.ts
//      npx tsx scripts/import-datasets.ts --out data/training --tmp /tmp/aghoy-datasets
//
// Stages:
//   1. License gate (per-source, enforced before anything is downloaded).
//   2. Download each dataset file (skips files already in --tmp).
//   3. Parse CSV -> rows, map labels/channels, run every text through the
//      authoritative Rejects layer (src/rejects/rejects.ts).
//   4. Dedupe by normalized content across all sources.
//   5. Emit a balanced corpus (majority class downsampled 2:1, seeded).
//   6. Write data/training/corpus.jsonl + manifest.json + THIRD_PARTY_NOTICES.
//
// Output is committed to the repo so any future training job (GitHub Actions
// free tier, local laptop, etc.) consumes a stable artifact. Rerunning with
// the same seed is deterministic.

import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { balanceRows, assertLicenseAllowed, dedupe, mapRow, parseCsv, resolveColumns } from "../src/training/pipeline";
import { TRAINING_SOURCES } from "../src/training/sources";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, "..");

const args = process.argv.slice(2);
const argValue = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const OUT_DIR = argValue("--out") ?? join(REPO_DIR, "data/training");
const TMP_DIR = argValue("--tmp") ?? join(REPO_DIR, "data/training/.cache");
const SEED = 20260807;
const FRESH = args.includes("--fresh"); // bypass the local download cache

const download = async (url: string, dest: string): Promise<void> => {
  if (!FRESH && existsSync(dest) && statSync(dest).size > 0) return;
  // 60s timeout so a hung upstream cannot block the pipeline forever.
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`download failed (${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 32) throw new Error(`download too small (${buf.length}b) for ${url}`);
  writeFileSync(dest, buf);
  console.log(`  downloaded ${buf.length.toLocaleString()} bytes -> ${dest}`);
};

const run = async (): Promise<void> => {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });

  const manifest: {
    generated_at: string;
    seed: number;
    balanced: { max_majority_ratio: number };
    sources: {
      id: string;
      name: string;
      license: string;
      license_url: string;
      attribution: string;
      license_note?: string;
      files: string[];
    }[];
    totals: Record<string, unknown>;
    corpus_sha256?: string;
  } = {
    generated_at: new Date().toISOString(),
    seed: SEED,
    balanced: { max_majority_ratio: 2 },
    sources: [],
    totals: {},
  };

  const allRows: ReturnType<typeof mapRow>[] = [];
  const perSource: Record<string, { rows: number; scam: number; legit: number; redacted_pct: number }> = {};

  for (const source of TRAINING_SOURCES) {
    // Enforce the license gate here, not just in getSource(): any source a
    // contributor adds to sources.ts is rejected before a single byte is
    // downloaded unless it carries a permissive license (or an approved
    // non-commercial exception, flagged per-source by the owner).
    assertLicenseAllowed(source.license, source.id, { nonCommercial: source.nonCommercial });
    console.log(`\n[${source.id}] ${source.name} (${source.license})`);
    const rows: ReturnType<typeof mapRow>[] = [];
    for (const file of source.files) {
      const local = join(TMP_DIR, file.path);
      await download(file.url, local);
      // Some sources (e.g. Kaggle) ship a zip with one CSV inside.
      let csvText: string;
      if (file.archiveEntry) {
        const { extractArchiveEntry } = await import("./import-archive.ts");
        csvText = extractArchiveEntry(local, file.archiveEntry);
      } else {
        csvText = readFileSync(local, "utf8");
      }
      const csv = parseCsv(csvText);
      const [header, ...data] = csv;
      const columns = resolveColumns(header, source.columns);
      console.log(`  ${file.path}: ${data.length.toLocaleString()} rows`);
      for (let i = 0; i < data.length; i++) {
        rows.push(mapRow(data[i], i, {
          source: source.id,
          license: source.license,
          channel: source.channel,
          labelMap: source.labelMap,
          columns,
          constantLabel: source.constantLabel,
        }));
      }
    }
    const deduped = dedupe(rows);
    const scam = deduped.filter((r) => r.label === "SCAM").length;
    const legit = deduped.filter((r) => r.label === "LEGIT").length;
    const redacted = deduped.filter((r) => r.redacted).length;
    perSource[source.id] = {
      rows: deduped.length,
      scam,
      legit,
      redacted_pct: Math.round((redacted / Math.max(1, deduped.length)) * 100),
    };
    allRows.push(...deduped);
    manifest.sources.push({
      id: source.id,
      name: source.name,
      license: source.license,
      license_url: source.licenseUrl,
      attribution: source.attribution,
      license_note: source.licenseNote,
      files: source.files.map((f) => f.url),
    });
  }

  console.log(`\n=== merge ===`);
  console.log(`total deduped: ${allRows.length.toLocaleString()}`);
  const dedupedAll = dedupe(allRows);
  console.log(`after cross-source dedupe: ${dedupedAll.length.toLocaleString()}`);
  const balanced = balanceRows(dedupedAll, 2, SEED);
  console.log(`balanced: ${balanced.length.toLocaleString()} (${balanced.filter((r) => r.label === "SCAM").length} scam / ${balanced.filter((r) => r.label === "LEGIT").length} legit)`);

  const scam = balanced.filter((r) => r.label === "SCAM").length;
  const legit = balanced.filter((r) => r.label === "LEGIT").length;
  const redacted = balanced.filter((r) => r.redacted).length;
  if (balanced.length === 0) {
    throw new Error("corpus is empty after dedupe/balance - refusing to write an empty training set");
  }
  const byChannel: Record<string, number> = {};
  for (const r of balanced) byChannel[r.channel] = (byChannel[r.channel] ?? 0) + 1;
  manifest.totals = { rows: balanced.length, scam, legit, redacted, redacted_pct: Math.round((redacted / balanced.length) * 100), by_channel: byChannel, per_source: perSource };

  const corpusPath = join(OUT_DIR, "corpus.jsonl");
  writeFileSync(corpusPath, balanced.map((r) => JSON.stringify(r)).join("\n") + "\n");
  console.log(`\nwrote ${corpusPath} (${(statSync(corpusPath).size / 1024 / 1024).toFixed(2)} MB)`);

  const hash = createHash("sha256").update(readFileSync(corpusPath)).digest("hex");
  manifest.corpus_sha256 = hash;

  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writeFileSync(join(OUT_DIR, "THIRD_PARTY_NOTICES.txt"), notices());
  console.log(`wrote manifest.json + THIRD_PARTY_NOTICES.txt`);
  console.log(`\ncorpus sha256: ${hash}`);
};

const notices = (): string =>
  `Project Aghoy training corpus - third-party notices
====================================================

The corpus in this directory is built from the following externally published
datasets. Each is included under its respective license. Aghoy sanitizes every
row through the Rejects PII layer before inclusion. Sources marked
"non-commercial" carry NonCommercial/ShareAlike terms (e.g. CC BY-NC-SA) and
are admitted on an explicit project-owner decision recorded in manifest.json
(license_note). They restrict commercial reuse of the derived corpus/model.

${TRAINING_SOURCES.map(
  (s) => `- ${s.attribution}
  License: ${s.license}${s.nonCommercial ? " (NON-COMMERCIAL / SHARE-ALIKE)" : ""}
  Source:  ${s.licenseUrl}
  Files:   ${s.files.map((f) => f.url).join(", ")}
`
).join("\n")}

The remainder of the corpus is Project Aghoy's own Taglish seed corpus and
sanitized community reports (Project Aghoy, see LICENSE in the repo root).
`;

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

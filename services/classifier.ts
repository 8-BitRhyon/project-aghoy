// services/classifier.ts - on-device scam classifier (TinyBERT, ONNX int8)
// served from /models/ via transformers.js, mirroring the self-hosted OCR
// pattern. Runs fully offline on the user's device: nothing leaves the phone.
//
// Integration policy (matches the training protocol in scripts/train_classifier.py):
//   - The model is a SECOND OPINION, never the primary verdict. The browser
//     already has the deterministic engine (src/brands/brands.ts) and the
//     server verdict; the classifier only fills the recall gap and can ESCALATE
//     a non-HIGH_RISK result at high confidence. It never downgrades.
//   - Threshold 0.22 (tuned on the validation fold; see models/tinybert-v1/
//     metrics.json). Escalation floor 0.30: the engine can rescue a model
//     near-miss, but a model confident a text is LEGIT (< 0.30) is never
//     overridden by the engine's PH-biased HIGH_RISK.
//   - Lazy-loaded on first scan; CacheFirst runtime caching keeps it cached.
//   - Any failure degrades to "model unavailable" - the deterministic path
//     must always work without it.

import { pipeline, env } from "@huggingface/transformers";
import { Verdict } from "../types";

// Model assets are self-hosted under /models/ (like /ocr/) so no third-party
// CDN is contacted at runtime (CSP: script-src 'self'). The ONNX Runtime wasm
// is also self-hosted under /ort-wasm/ - without this, onnxruntime-web would
// fetch it from cdn.jsdelivr.net, which the CSP connect-src blocks.
env.allowLocalModels = true;
env.useBrowserCache = true;
// The ONNX wasm backend object always exists in transformers.js v4 (verified:
// env.backends.onnx.wasm). wasmPaths must be an OBJECT with both URLs:
// transformers.js's wasm pre-loader checks `typeof wasmPaths === "object" &&
// wasmPaths?.wasm && wasmPaths?.mjs`; a bare directory string is treated as
// falsy-for-cache, the pre-load is skipped, and onnxruntime-web falls back to
// its CDN default (which CSP then blocks). Self-host both files under /ort-wasm/.
const onnxWasm = env.backends?.onnx?.wasm as { wasmPaths?: unknown; proxy?: boolean } | undefined;
if (onnxWasm) {
  onnxWasm.wasmPaths = {
    wasm: "/ort-wasm/ort-wasm-simd-threaded.asyncify.wasm",
    mjs: "/ort-wasm/ort-wasm-simd-threaded.asyncify.mjs",
  };
} else {
  console.warn("[classifier] onnx wasm backend missing - wasmPaths not set; inference may be CSP-blocked");
}
export const ORT_WASM_DIR = "/ort-wasm";

export const MODEL_DIR = "/models/tinybert-v1";
export const MODEL_ID = `${MODEL_DIR}`;
// transformers.js appends the dtype suffix to the model file name: q8 => "_quantized",
// so base "model" resolves to onnx/model_quantized.onnx (our committed int8 file).
export const MODEL_FILE_NAME = "model";
// Three-zone decision policy (non-overlapping, from the training protocol):
//   p >= THRESHOLD (0.72, tuned on validation of the PH-augmented corpus) => flag
//   p <= FLOOR    (0.30)                      => model is confident LEGIT
//   FLOOR < p < THRESHOLD                     => uncertain, model abstains
// FLOOR is BELOW THRESHOLD so "flag" and "escalate" are the same zone - a
// flagged score always escalates, and a confident-legit score never does.
export const MODEL_THRESHOLD = 0.72; // tuned on validation fold (tinybert-v1)
export const MODEL_CONFIDENT_LEGIT_FLOOR = 0.3;

export interface ClassifierVerdict {
  scamProb: number;
  flag: boolean; // scamProb >= MODEL_THRESHOLD
  confidentLegit: boolean; // scamProb <= MODEL_CONFIDENT_LEGIT_FLOOR
  loaded: boolean;
}

let classifierPromise: Promise<any> | null = null;

// Lazy singleton: load once, reuse for the session. On FAILURE the singleton
// is reset so a later scan retries (a transient load error must not poison
// the rest of the session). Never throws to callers - returns null so callers
// fall through to the deterministic path.
export const getClassifier = (): Promise<any | null> => {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      try {
        // The committed model_quantized.onnx is already int8; transformers.js
        // picks it up by filename. dtype: "q8" pins the runtime dtype so it is
        // never re-quantized to fp32 in memory on weak devices.
        const cls = await pipeline("text-classification", MODEL_ID, {
          dtype: "q8",
          model_file_name: MODEL_FILE_NAME,
        });
        return cls;
      } catch (err) {
        console.error("[classifier] load failed:", err);
        classifierPromise = null; // allow a retry on the next scan
        return null;
      }
    })();
  }
  return classifierPromise;
};

export const clearClassifier = (): void => {
  classifierPromise = null;
};

// Pure fusion logic (testable without a model): given a classifier probability
// and the current verdict, decide the final verdict. Rules-first; the model can
// only escalate, never downgrade. Three zones (floor <= threshold, disjoint):
//   p >= threshold  => model flags -> escalate SAFE/SUSPICIOUS to SUSPICIOUS
//   p <= floor      => confident LEGIT -> never escalate
//   floor < p < threshold => uncertain -> abstain, return current verdict
export const fuseModelWithVerdict = (
  currentVerdict: Verdict,
  scamProb: number,
  opts: { threshold?: number; floor?: number } = {}
): Verdict => {
  const threshold = opts.threshold ?? MODEL_THRESHOLD;
  const floor = opts.floor ?? MODEL_CONFIDENT_LEGIT_FLOOR;
  // Never downgrade: HIGH_RISK stays.
  if (currentVerdict === Verdict.HIGH_RISK) return Verdict.HIGH_RISK;
  // A confident legit call is never escalated by the model.
  if (scamProb <= floor) return currentVerdict;
  // Model flag: escalate to SUSPICIOUS (never HIGH_RISK - the deterministic
  // engine or the server does that; this keeps the false-positive budget).
  if (scamProb >= threshold) return Verdict.SUSPICIOUS;
  // Uncertain mid-band: abstain.
  return currentVerdict;
};

export const classifyText = async (text: string): Promise<ClassifierVerdict | null> => {
  try {
    const cls = await getClassifier();
    if (!cls) return null;
    const result = await cls(text, { topk: 2 });
    const scam = (Array.isArray(result) ? result : [result]).find(
      (r: any) => r.label === "SCAM"
    );
    if (!scam) return null;
    const scamProb = Number(scam.score);
    return {
      scamProb,
      flag: scamProb >= MODEL_THRESHOLD,
      confidentLegit: scamProb <= MODEL_CONFIDENT_LEGIT_FLOOR,
      loaded: true,
    };
  } catch (err) {
    console.error("[classifier] inference failed:", err);
    return null;
  }
};

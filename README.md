# Project Aghoy

**Protect your family from scams. Free, private, non-profit, and built for the Philippines.**

Scammers don't target tech-savvy people. They target your lola, your parents, your OFW relatives - the people who trust a text that says "your GCash is locked." Project Aghoy gives them three shields: **train** them to spot scams, **check** suspicious messages before they act, and **warn** the whole community when a new scam is found.

No accounts. No login. No data sold. A server-authoritative PII filter (the **Rejects layer**) redacts names, numbers, IDs, and secrets before any content leaves the device or is stored - honoring the Data Privacy Act of 2012 (RA 10173).

[![Live app](https://img.shields.io/badge/live-project--aghoy.pages.dev-cyan)](https://project-aghoy.pages.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-287-green.svg)]()
[![Privacy by design](https://img.shields.io/badge/privacy-Rejects%20layer-blue.svg)](SECURITY.md)

---

## Why it exists

Scams are a daily reality in the Philippines: SMS phishing, vishing calls, task scams, parcel-fee demands, QR code (quishing) traps, fake investments, and impersonations of wallets, banks, telcos, and government agencies. Victims lose savings, and the pressure to act fast is exactly what scammers exploit.

Project Aghoy meets that threat three ways:

- **Detection.** Analyze a suspicious SMS, email, job offer, or screenshot before acting - and get an explanation you can understand in your own language.
- **Education.** The Dojo is a scam-radar trainer with 400+ realistic drills in plain language. It is built for grandparents: big text, no jargon, no tech experience needed.
- **Privacy by design.** The messages you analyze contain personal data. The Rejects layer redacts names, numbers, IDs, and secrets before anything leaves your device or is stored. This respects the Data Privacy Act of 2012 (RA 10173).

## Features

### Scanner
Paste text or upload a screenshot. OCR extracts the text, and the analysis returns a verdict (`SAFE` / `SUSPICIOUS` / `HIGH_RISK`), a risk score, red flags, and an educational tip in your language - with the real wallet hotline to call and the government channel to report it.

### On-device AI classifier (offline-capable)
A fine-tuned **TinyBERT** model (14.6 MB, int8 ONNX) runs directly in your browser via `transformers.js` - no server, no internet needed, and nothing leaves your phone. It acts as a **second opinion** on top of the deterministic engine: it can escalate a borderline verdict at high confidence but never overrides a confident result, keeping the false-positive rate low. See [the ML pipeline](#machine-learning).

### Deterministic brand detection
43 Philippine brands (wallets, banks, telcos, delivery, e-commerce, government) detected with leetspeak-aware, boundary-aware matching. Powers victim-support routing and works even when the AI provider is down.

### Rejects PII layer
Server-authoritative redaction of credit cards (Luhn-validated), Philippine and international phone numbers, emails, API keys, Philippine IDs (SSS, TIN, PhilHealth, LTO, passports, Pag-IBIG, UMID), OTPs, CVVs, names, and dates of birth. Runs inbound and outbound on every request and before every database write. Idempotent.

### Self-hosted OCR
Tesseract.js runs entirely from `public/ocr/` (worker, wasm cores, pinned English traineddata). No third-party CDN at runtime - CSP compliant and supply-chain safe.

### Training Dojo
A role-play chat where an AI simulates a scammer. Spot the red flags and end the game by reporting it. Authorized cybersecurity training, not a real scam assistant.

### Community blacklist
Every scam someone reports is sanitized and feeds a shared database, so the next person who receives that exact fake GCash alert sees "this domain has been reported N times." Phone numbers are only ever stored as SHA-256 hashes.

### Everything else
- **SmartSupport:** verified official channels for 36 banks, wallets, telcos, couriers, and government agencies, including PNP-ACG reporting guidance.
- **4 languages:** Tagalog, Bisaya, Ilocano, English.
- **Offline fallback verdict:** when the AI provider is unavailable, a deterministic rule engine still produces a verdict.
- **PWA:** installable, offline-ready assets (OCR and model cached separately).

## Machine learning

Project Aghoy trains and ships its own lightweight scam classifier - entirely free, entirely open.

```
public datasets (license-gated)         Project Aghoy's own corpus
      |                                          |
      v                                          v
 scripts/import-datasets.ts -> data/training/corpus.jsonl (15k+ rows)
      |
      v
 scripts/train_classifier.py  ->  TinyBERT fine-tune (anti-overfitting
      |                            protocol: provenance split, leakage
      |                            guard, early stopping, val-tuned
      |                            threshold)
      v
 scripts/export_onnx.py  ->  int8 ONNX (14.6 MB) -> public/models/
      |
      v
 services/classifier.ts  ->  on-device inference in the browser
                             (transformers.js, offline, 0 PII leaves
                             the phone)
```

- **Data pipeline:** `src/training/pipeline.ts` enforces a strict license gate (Apache-2.0 / MIT / CC-BY-4.0 / CC0, plus documented owner-approved non-commercial exceptions). Every row passes through the Rejects layer before it enters the corpus - training matches production.
- **Anti-overfitting protocol:** provenance-aware stratified 80/10/10 split, a near-duplicate leakage guard, early stopping, class weighting, and a threshold tuned on validation only. Test scores are measured once, on a held-out fold.
- **Measured performance (held-out test):** F1 0.94, precision 0.97, recall 0.91, false-positive rate **1.4%**, AUC 0.99. On Aghoy's own Taglish reality check (22 real PH scam archetypes the model never trained on), it catches **22/22 (100%)** - up from 16/22 before the Taglish training data was added.
- **Deterministic engine as verifier:** the 43-brand rule engine is the authority; the model only fills the recall gap. A naive OR-fusion doubles the false-positive rate, so the shipped policy is conservative by design.
- **Training is reproducible:** `scripts/requirements-train.txt` pins exact versions. Run `scripts/train_classifier.py` on a laptop; the whole cycle is free.

## Architecture

```
+-----------------------------------------------------------+
|                    Browser (React 19 SPA)                  |
|  Retro terminal UI + PWA, 4 languages, consent gate       |
|  aiService.ts: OCR (self-hosted Tesseract)                |
|  classifier.ts: on-device TinyBERT (transformers.js)      |
|  client pre-send Rejects redaction (defense-in-depth)     |
|  deterministic brand/intent enrichment                    |
|  localStorage history (20 scans, sanitized)               |
+------------------+----------------------------+-----------+
                   | POST /api/analyze           | POST /reports, GET /indicators
                   v                            v
+------------------------------+   +----------------------------------------+
| Cloudflare Pages Function    |   | Worker project-aghoy-dojo              |
| functions/api/analyze.js     |   | src/worker/dojo.ts                     |
|  Rejects inbound + outbound  |   |  RateLimiter DO (per-IP)               |
|  input caps, 25s timeout     |   |  DojoSession DO (per-token game)      |
|  per-isolate rate limit      |   |  Rejects before any persistence        |
|                              |   |  storage routes: /reports, /indicators |
|                              |   |  /indicators/verify, /evidence, seed   |
+------------------------------+   +-------+----------------+--------------+
                   |                       |                |
                   v                       v                v
+---------------------------+   +----------------+   +----------------------+
| Cloudflare AI Gateway     |   | D1 database    |   | Vectorize index      |
| Cerebras gpt-oss-120b     |   | reports,       |   | scam-index           |
| Groq gpt-oss-120b (fb)    |   | indicators,    |   | 768d, cosine         |
|                           |   | blacklist      |   | seeded 22 entries    |
+---------------------------+   +----------------+   +----------+-----------+
                                                                 |
                                                                 v
                                                         Workers AI: embeddings
                                                         (@cf/baai/bge-base-en-v1.5)
                                                         + Dojo LLM (llama-3-8b)
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 6, Tailwind CSS, vite-plugin-pwa, transformers.js |
| On-device ML | TinyBERT int8 ONNX (14.6 MB), self-hosted under `public/models/` |
| Hosting | Cloudflare Pages (SPA + Functions) |
| API backend | Cloudflare Pages Functions (`/api/analyze`) |
| Worker | Cloudflare Workers + Durable Objects |
| AI | Cloudflare AI Gateway (Cerebras gpt-oss-120b, Groq gpt-oss-120b fallback) + Workers AI |
| Database | D1 (`reports`, `indicators`, `blacklist`) |
| Vector search | Vectorize `scam-index` (768d, cosine) |
| Object storage | R2 (evidence; binding commented out until account enablement) |
| OCR | Tesseract.js, self-hosted under `public/ocr/` |
| Language | TypeScript (strict) for app and Worker |
| Tests | Vitest, 287 tests across 9 suites |
| CI | GitHub Actions (SHA-pinned actions, gitleaks full-history secret scan, npm audit) |
| ML training | Python 3.12 + PyTorch (CPU), pinned in `scripts/requirements-train.txt` |

## Quick start

Prerequisites:

- Node.js 20 or newer
- Python 3.12 (only for ML training)
- A Cloudflare account and a logged-in wrangler (`npx wrangler login`)
- Vendor API keys (Cerebras, Groq) and your Cloudflare AI Gateway IDs for full AI analysis

Run the app:

```bash
npm install
npm run dev
```

- The dev server runs on port 3000 (`http://localhost:3000`).
- For local API calls, create a `.dev.vars` file modeled on `.env.example` with `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `CF_ACCOUNT_ID`, and `CF_GATEWAY_ID`. Never commit real keys.
- Accept the privacy consent gate when the app prompts you.
- Paste a suspicious message, or upload a screenshot, and hit Scan.

Run the full local gate:

```bash
npm run check        # typecheck + test + build
```

## Training the classifier (optional, free)

```bash
# One-time setup: Python 3.12 virtualenv
python3.12 -m venv .venv-train
.venv-train/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv-train/bin/pip install -r scripts/requirements-train.txt

# Build the corpus from licensed public datasets
npx tsx scripts/import-datasets.ts

# Fine-tune TinyBERT (runs on CPU) and export the int8 ONNX
.venv-train/bin/python scripts/train_classifier.py --tag v1
.venv-train/bin/python scripts/export_onnx.py \
  --checkpoint models/v1/checkpoint-XXXX --out models/v1/onnx --target arm64

# Copy the artifact to the PWA
cp models/v1/onnx/model_quantized.onnx public/models/tinybert-v1/onnx/
```

See `CONTRIBUTING.md` for the data-contribution and licensing rules.

## Deployment

1. **Pages site.** Connect the repository to Cloudflare Pages. Build command: `npm run build`, output directory: `dist`. The `functions/` directory deploys as Functions automatically.
2. **Worker.** From the repo: `npx wrangler deploy`. This deploys `project-aghoy-dojo` with its Durable Objects, D1, and Vectorize bindings.
3. **Storage setup.** Run `bash scripts/setup-storage.sh` to create the D1 database, apply migrations, and create the R2 evidence bucket (idempotent).
4. **Secrets.** Set Worker secrets with `npx wrangler secret put`: `STORAGE_ADMIN_KEY`, `SESSION_SIGNING_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `CF_ACCOUNT_ID`, `CF_GATEWAY_ID`. The Pages Function needs the same AI keys and gateway IDs as Pages environment variables.
5. **Vectorize seed.** The `scam-index` already exists and is seeded. To reseed: `curl -X POST https://project-aghoy-dojo.rhyonfs.workers.dev/seed/vectorize -H "Authorization: Bearer $STORAGE_ADMIN_KEY" -d @corpus.json`.
6. **R2 (pending).** Enable R2 on your Cloudflare account, uncomment the `EVIDENCE` binding in `wrangler.toml`, run `npx wrangler r2 bucket create project-aghoy-evidence`, and redeploy. Evidence routes return 501 until then.

## Project structure

```
App.tsx                        main scanner UI (SCANNER / TRAINING_DOJO tabs)
services/aiService.ts          client orchestration: OCR, /api/analyze, storage loop
services/classifier.ts         on-device TinyBERT inference + verifier fusion policy
functions/api/analyze.js       Pages Function scanner endpoint (AI Gateway)
functions/_middleware.js       CORS allowlist + security headers
src/rejects/rejects.ts         server-authoritative PII filter (Rejects layer)
src/brands/brands.ts           deterministic brand/intent detection + fallback verdict
src/support/supportDatabase.ts typed victim-support contacts (SmartSupport)
src/worker/dojo.ts             Worker: Durable Objects + storage routes
src/worker/storage.ts          D1 + R2 + Vectorize access (sanitized writes only)
src/worker/indicators.ts       pure indicator extraction (domain/url/keyword)
src/api/storageClient.ts       browser client for the storage layer
src/training/                  ML data pipeline: license gate, splits, leakage guard
utils/flagDefinitions.ts       flag taxonomy (29 flags)
utils/privacy.ts               client-side display sanitization (not a boundary)
data/scam-corpus.jsonl         Vectorize seed corpus (22 entries)
data/training/                 sanitized ML training corpus + manifest + notices
public/ocr/                    self-hosted Tesseract worker, wasm cores, traineddata
public/models/                 self-hosted ONNX classifier + tokenizer
scripts/                       hooks, storage setup, ML import/train/export
migrations/                    D1 schema
```

## Testing

- `npm test` runs the full Vitest suite: **287 tests across 9 suites**.
- `npm run check` is the local gate: typecheck + test + build. CI runs the same plus a SHA-pinned-actions audit, a gitleaks full-history secret scan, and `npm audit`.
- The pre-commit hook (`bash scripts/install-hooks.sh`) runs the gate before every commit.

| Suite | Tests | Covers |
| --- | --- | --- |
| `src/rejects/rejects.test.ts` | 44 | PII redaction rules, idempotency |
| `src/brands/brands.test.ts` | 31 | brand detection, intents, fallback verdict |
| `src/support/supportDatabase.test.ts` | 6 | support data integrity |
| `src/worker/indicators.test.ts` | 10 | indicator extraction |
| `src/training/pipeline.test.ts` | 19 | license gate, CSV parse, dedupe, balancing |
| `src/training/split.test.ts` | 27 | anti-overfitting splits, leakage guard |
| `services/classifier.test.ts` | 6 | on-device verifier fusion policy |
| `utils/privacy.test.ts` | 15 | client-side sanitization |
| `utils/flagDefinitions.test.ts` | 9 | flag taxonomy |

## Status and roadmap

Live today:

- Scanner (text + screenshot OCR) with AI verdicts through Cloudflare AI Gateway.
- **On-device TinyBERT classifier** (offline, 14.6 MB, verifier-gated).
- Rejects layer enforced server-side on both endpoints and before every storage write.
- Deterministic brand detection (43 brands) and the no-provider fallback verdict.
- Dojo training game with per-token sessions and a hard per-session AI turn cap.
- Storage layer: D1 reports and indicators, Vectorize similar-scam search, phone-hash "reported N times" blacklist.
- License-gated ML training pipeline with a committed, sanitized 15k+ row corpus.
- Self-hosted OCR, PWA installability, 4 languages, SmartSupport routing, family warning share card, PNP-ACG report copy.

Pending:

- R2 evidence store: blocked on account-level R2 enablement (Cloudflare error code 10042), then uncomment the binding and redeploy.
- Cloudflare WAF rate limiting for `/api/analyze`: the current Pages limiter is per-isolate in-memory and not globally accurate (see SECURITY.md).
- UI surfacing of indicator/blacklist lookups: `storageClient.lookupIndicator` is client-ready; wiring it into the scanner result view is in progress.
- Taglish-specific training data: expanding the PH corpus (community reports + licensed datasets) to close the model's gap on romance, marketplace, and family-emergency archetypes.

## Contributing

Project Aghoy is a community project. We welcome contributors of every skill level - developers, designers, security researchers, translators, and concerned citizens.

- **Report a bug or request a feature:** open an [issue](https://github.com/8-BitRhyon/project-aghoy/issues).
- **Write code:** see [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, code standards, and testing requirements.
- **Report a security issue:** see [SECURITY.md](SECURITY.md) - never open a public issue for vulnerabilities.
- **Share scam data:** see [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-brand-or-flag) for how to add brands, flags, and dataset sources under the license gate.

By contributing you agree your contributions are licensed under the MIT License.

## Security

Project Aghoy takes privacy and security seriously: the Rejects layer, secret hygiene, supply-chain controls, and a responsible-disclosure process are documented in [SECURITY.md](SECURITY.md).

## License

MIT. Copyright (c) 2025 Project Aghoy. See [LICENSE](LICENSE).

## Links

- Live app: https://project-aghoy.pages.dev
- Dojo worker: https://project-aghoy-dojo.rhyonfs.workers.dev
- Source: https://github.com/8-BitRhyon/project-aghoy
- Security posture: [SECURITY.md](SECURITY.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)

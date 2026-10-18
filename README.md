# HULK Studio AI — Render backend repair v2

Continue the existing **FlutterFlow → Render → NVIDIA → Supabase** integration. No provider migration. This package fixes the uploaded backend; it does not claim that your FlutterFlow button or live Render service has already been repaired.

## Current verification

- Actual local Express HTTP tests cover auth boundaries, browser preflight headers, JSON/byte limits, real Sharp image decoding, safe AI parsing, exact set transcription, selected series, retry deduplication and draft saving.
- NVIDIA and Supabase network requests are mocked in the HTTP tests. This is NOT a live provider test.
- Nine additional real Postgres checks ran with synthetic users/drafts in a transaction and were rolled back. They verify the canonical content format, owner RLS, exact null/zero retention, primary-key duplicate protection, forged-owner rejection and non-owner/anon denial. Production member/program records were not changed.
- `npm ci` and `npm test` were run; test output and dependency audit are included.
- Actual NVIDIA extraction, Render deployment and FlutterFlow browser/button tests remain pending: the Render URL, exact NVIDIA model/endpoint and account access were not supplied. No secret values were requested or stored.

## What was confirmed wrong in the uploaded code

1. Missing set count/reps were replaced with guessed 3 and 10–12 defaults. Shared ranges could be reduced to the first number.
2. Set values were rounded, clamped or silently truncated beyond limits that differed from the real Studio validator.
3. “Each side” was inferred from dumbbell equipment instead of the source checkbox.
4. Unspecified per-set rest could be overwritten by a general rest value.
5. Muscle vocabulary included unsupported IDs; resistance-band equipment was missing.
6. Invalid/missing selected series silently fell back to AI selection or HULK FIT.
7. Inserts did not run the actual current Studio validator, and retries could create duplicate rows.
8. Incomplete AI output, permissive Base64 decoding and unconditional aggressive image shrinking could damage input/output without a clear failure.
9. The README claimed FlutterFlow mapping errors and live success without the actual bindings/live tests. Those frontend diagnoses remain unverified.

The replacement uses the six shared modules retrieved from the live fitness-library v4 backend. Do not edit these copied modules to bypass validation. All calls to Supabase use the public key and verified caller JWT; no service-role key is needed.

## Deploy to the EXISTING Render service

Back up the current repository/deployment first. Replace the backend with **all** runtime files, not only server.js and package.json:

- server.js
- workout.mjs
- package.json + package-lock.json
- the complete studio/ directory (six modules)

Use Node 22 or 24, Build command `npm ci`, Start command `npm start`. PORT is read from Render. Do not include node_modules or a real .env in Git.

Set the following server-side environment variables:

| Variable | Value |
|---|---|
| SUPABASE_URL | https://iufsxnlonwnylqerwafs.supabase.co |
| SUPABASE_ANON_KEY | The project public anon/publishable key; NOT service-role |
| NVIDIA_API_KEY | Your NVIDIA API credential, entered only in Render |
| NVIDIA_MODEL | Exact model identifier from your already-selected NVIDIA model |
| NVIDIA_ENDPOINT | Exact documented inference endpoint for that model; defaults to https://integrate.api.nvidia.com/v1/chat/completions |
| ALLOWED_ORIGINS | Comma-separated exact origins of your website and actual FlutterFlow Test/Run app |

A model-specific route can differ from the generic chat endpoint. For example, NVIDIA documents a specific `/v1/meta/llama-3.2-90b-vision-instruct` route for that model. Copy the model/endpoint pair from your model's official API example; do not choose a model merely because it was a placeholder in the old code.

Defaults for origins: https://hulkfitnessarena.in, https://www.hulkfitnessarena.in, https://app.flutterflow.io. Your running FlutterFlow app can have a different origin. Obtain it from the actual browser URL/Network Origin and add that exact value. `*` is rejected. CORS is not authentication; server token and active-owner checks remain mandatory.

Open `/health`: `ok:true` verifies only the process. `configured:true` means the required variables exist; it does NOT prove NVIDIA or database connectivity. Prove those using an authenticated synthetic import and actual logs.

Read FLUTTERFLOW_SETUP.md next.

## API

POST `/extract-workout`

Headers: `Content-Type: application/json`, `Authorization: Bearer <current Supabase user access token>`.

```json
{
  "workoutText": "Chest Beginners...",
  "imageBase64": "",
  "seriesCode": "hulk_fit",
  "title": "",
  "action": "import"
}
```

- Supply text, imageBase64, or both. An optional `images` array of Base64 strings supports grouped screenshots when the selected NVIDIA model supports that count. Preserve screenshot order.
- `seriesCode` is required: hulk_fit, alpha, aura or goat. AI cannot override the destination.
- `action` defaults to import: save a valid **draft only**. `preview` returns the validated draft without saving. Publishing and real member assignment stay in the existing Studio.
- Never send a file object or arbitrary external image URL. JPEG, PNG and WEBP single-frame inputs only. The server checks decoded size and pixel count.
- Default JSON body limit 16 MiB, individual decoded image limit 5 MiB, combined decoded image limit 10 MiB, max 4 images. These are app caps, NOT NVIDIA guarantees. Configure stricter limits for your actual model. Optional NVIDIA_MAX_IMAGE_BASE64_CHARS enforces a documented endpoint-specific inline cap. There is no universal NVIDIA 180,000-character rule here.
- Large images are resized only to the configured IMAGE_MAX_EDGE (default 4096). Inputs that exceed a configured provider cap are rejected with a clear message rather than repeatedly blurred. NVCF asset-upload/polling flows are not implemented; a model requiring them needs a separate verified adapter. NVIDIA 202 jobs return ai_pending and are never called saved.

Success is HTTP 201 on creation or 200 on an identical import retry. It returns success, message, programId, series, title, status, exerciseCount, duplicate, warnings and requestId. Exact-input retry IDs are derived from verified owner, selected series, title, text and image bytes. Same exact input never upserts or overwrites a record. Editing the input/title or re-encoding an image can create a new import; this is not fuzzy duplicate detection.

Errors use a non-2xx status and `{success:false,error,code,requestId}`. A `needs_review` error also returns the extracted `review` object; nothing was saved. Do not label it a successful import merely because the AI responded.

## Deliberate compatibility boundaries

The existing live Studio supports exact per-set reps (integers 1–60), 1–6 sets per exercise, up to 12 exercises per session, 7 session slots, KG up to 1000 and rest 0–300 seconds or null. It does not currently support a rep range string inside a per-set row. The importer returns the original range in a needs_review response rather than silently converting it. Mixed/timed/other prescriptions require an explicit compatible Studio extension; do not invent numeric reps to make them save.

Each-side source true/false is preserved. If not supplied, the existing checkbox remains off with a warning; the backend does not infer true from dumbbells. Unknown muscles remain unselected in a draft, to be reviewed before publication. Equipment/muscle mapping is AI-assisted and requires coach review. Source tempo is retained as a labelled source note; new coaching advice is not generated.

Single-session imports use duration 1 day and the first existing slot if no weekday was stated. Explicit weekdays retain their positions; this is a template layout, not an invented training recommendation. No diet targets, meals, memberships or assigned plans are created/changed.

## Diagnostics and limits

Safe Render log stages: backend_received, input_validated, ai_extracted, studio_validated, draft_saved, with a request ID. Never log keys, full JWTs or Base64.

- 400: invalid binding/input/JSON or missing/invalid series.
- 401: missing/expired/wrong-project Supabase access token.
- 403: non-owner or disallowed browser origin.
- 409: another import is running, destination changed or identifier conflict.
- 413: byte/image/model-cap limit; inspect code, not only status.
- 415: wrong Content-Type.
- 422 needs_review/studio_validation/database_error: inspect error and original review data; no false success.
- 429: app/provider rate cap.
- 502: provider/incomplete/invalid response.
- 503/504: configuration, connectivity, pending-provider flow or timeout. A timed-out DB write might already have committed; retry identical input before changing it.

Per-owner limits default to 6 AI calls/minute and 200/day; counters and the one-inflight-owner lock are in-memory per Node process, so they reset on restart and are NOT a distributed billing cap. Keep one instance for this repair and configure provider billing limits; add a durable shared queue/rate limiter before multi-instance bulk rollout. No distributed thousand-job queue is claimed in this patch.

## Separate existing security finding

Read-only inspection confirmed the legacy `public.workouts` table had RLS disabled plus anon DML grants. This backend does not use or change that table. `training_programs`/`training_series` already have owner RLS and no anon table privileges. Existing legacy staff/member policies are present, but must be checked against actual app use before a production RLS change. Do not disable protections, drop policies or run broad schema scripts to fix this import. Security remediation of the legacy table remains pending; no production policy changes were made by this patch.

## Primary documentation checked

- FlutterFlow API variables/body/auth: https://docs.flutterflow.io/resources/backend-logic/rest-api/
- FlutterFlow Custom Functions: https://docs.flutterflow.io/concepts/custom-code/custom-functions/
- NVIDIA model-specific image endpoint example: https://docs.api.nvidia.com/nim/reference/meta-llama-3_2-90b-vision-instruct-infer
- Express CORS behaviour: https://expressjs.com/en/resources/middleware/cors/
- Supabase caller-auth context: https://supabase.com/docs/guides/functions/auth-legacy-jwt

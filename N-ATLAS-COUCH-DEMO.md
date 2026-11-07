# Elevoni × N-ATLaS — Private COUCH Demo Setup

This guide runs the existing N-ATLaS Kit gateway in Modal development/serve mode and connects a **local** Elevoni backend and Vendor Portal to it. It does not deploy Elevoni or create a permanent Modal deployment.

## Scope and safeguards

- N-ATLaS chat and ASR are accessed only through the authenticated N-ATLaS Kit gateway.
- The browser never receives `NATLAS_API_KEY`. The key is configured only in the local Elevoni backend environment.
- `NATLAS_DEMO_ENABLED` defaults to `false`; enable it only in the private local demo environment.
- The existing vendor authentication and approved-vendor authorization remain required.
- The assistant is read-only. It can prepare an editable listing draft but cannot publish a listing, change records, or place an order.
- Elevoni includes an authenticated server-side TTS proxy. The N-ATLaS Kit gateway still returns 501 by default, so “Listen” falls back to the browser/device speech engine. Server-side model speech remains opt-in and must not be enabled until the relevant voice-model permissions are confirmed.
- Nigerian Pidgin has no dedicated ASR model in this kit; voice input falls back to Nigerian English ASR and may be inaccurate.
- The “Listen” action first requests a WAV from the authenticated Elevoni backend speech proxy. If the Modal gateway returns 501 (the default while server TTS is disabled), Elevoni falls back to a browser/device voice. A matching Hausa, Igbo or Yoruba device voice may not be installed, so the UI clearly warns when it must use a default voice.
- Modal `serve` provides a temporary HTTPS web URL that is reachable over the internet while the process is running; it is not a private-network-only endpoint. Inference routes require the gateway Bearer key, while `/health` is unauthenticated. Keep the URL and key out of public posts and do not share the key. Do not use this setup as a production deployment or imply commercial rights have been cleared.

## 1. Start the private N-ATLaS gateway

From the N-ATLaS-Kit repository root, authenticate with the Modal profile that owns the `natlas-hf`, `natlas-api`, and `natlas-hf-cache` resources, then run:

```powershell
modal serve serve/modal_app.py
```

Keep this terminal running. Modal prints a temporary gateway URL. The URL is internet-reachable while the process is active, but chat/transcription require the configured Bearer key. It is not a permanent deployment and the service stops when the serve process is stopped.

The existing Modal `natlas-api` secret must contain `NATLAS_API_KEYS`. Elevoni's backend `NATLAS_API_KEY` must be the matching key value. Never put that value in frontend/Vite variables or commit it. If the original value is unavailable, rotate the Modal secret and update the local backend `.env` with the same newly generated value.

Check the gateway health endpoint in a separate terminal/browser:

```powershell
Invoke-RestMethod -Uri "<TEMPORARY_GATEWAY_URL>/health"
```

The health endpoint reports LLM and ASR readiness. It does not require the API key. Chat and transcription do require `Authorization: Bearer <key>` at the gateway; Elevoni's backend supplies it.

## 2. Configure Elevoni backend locally

Copy `backend/.env.example` to `backend/.env` if you have not already done so. Set these values in `backend/.env`:

```env
NATLAS_DEMO_ENABLED=true
NATLAS_BASE_URL=<TEMPORARY_GATEWAY_URL>
NATLAS_API_KEY=<MATCHING_GATEWAY_KEY>
NATLAS_MODEL=NCAIR1/N-ATLaS
```

Keep the existing `MONGO_URI`, `JWT_SECRET`, and other local backend settings. Do not send `.env` to anyone or include it in a ZIP.

## 3. Start Elevoni locally

Terminal 1 — backend:

```powershell
cd backend
npm ci
npm run server
```

Terminal 2 — Vendor Portal:

```powershell
cd vendor-portal
npm ci
npm run dev
```

Sign in using an existing approved vendor account. Open the N-ATLaS workspace from the Vendor Portal.

## 4. Demo flow

1. Select Hausa, Igbo, Yoruba, or Nigerian English.
2. Record a short voice message.
3. Stop recording and wait for the ASR transcript.
4. Review/edit the transcript in the composer.
5. Send it to N-ATLaS and review the answer.
6. If a listing draft is returned, review it and continue through the existing vendor listing form. Drafts cover all five current product form categories: Catfish & Aquaculture, Fishery Products & Equipment, Poultry & Eggs, Livestock & Meat, and Food Crops. Nothing is auto-published, and the existing vendor form still enforces permissions.
7. Use “Listen” to request an N-ATLaS-generated WAV when the private gateway has licensed TTS enabled; otherwise the interface falls back to a browser/device voice. Device voice availability and pronunciation depend on the device.

## 5. Troubleshooting

- **503 from Elevoni N-ATLaS routes:** confirm `NATLAS_DEMO_ENABLED=true` and restart the local backend.
- **Gateway auth failure:** check that `NATLAS_API_KEY` matches one of the values in Modal's `NATLAS_API_KEYS` secret. Do not paste keys into chat or logs.
- **Gateway unavailable:** keep `modal serve` running and update `NATLAS_BASE_URL` if the temporary URL changes.
- **No transcript:** try a shorter, clearer recording in a supported language and check `/health` for ASR readiness.
- **Pidgin transcript poor:** this kit has no dedicated Pidgin ASR model; use English text entry or review/correct the transcript manually.
- **Spoken response voice differs:** the Modal gateway's TTS route is disabled by default. Browser fallback uses installed device voices, which may not support Hausa, Igbo or Yoruba accurately.

## Licensing note

This is a private technical demonstration setup, not a licence grant. The N-ATLaS model and ASR checkpoints have their own terms. Awarri's written clarification for Elevoni's intended use remains outstanding. The backend speech proxy is implemented, but the Modal TTS speaker remains disabled by default. Do not set `NATLAS_ENABLE_TTS=true` until the Soro-TTS/MMS-TTS permissions and intended use are confirmed. After clearance, start `modal serve` from PowerShell with `$env:NATLAS_ENABLE_TTS="true"` in that same session. The flag only enables the optional private gateway TTS route; it does not make the service production-ready or grant commercial rights. Do not publicly launch or commercially operate the model integration until the required permissions are confirmed.

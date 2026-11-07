# N-ATLAS Intelligence Integration

## What changed

- Added authenticated `POST /api/n-atlas/chat` for approved vendor profiles.
- Added a server-side adapter for the Nigerian N-ATLaS model through its OpenAI-compatible chat-completions gateway. The browser never receives the gateway API key.
- Grounds responses with the authenticated vendor's own product drafts/listings and a bounded set of their own sales records, plus a bounded sample of currently approved and available marketplace listings from approved vendor profiles.
- Does not send buyer names, phone numbers, emails, or other buyer contact details to the model.
- Treats the assistant as read-only: it can prepare a draft, but cannot publish products, change records, or place orders.
- Applies request validation, bounded conversation history, request timeout, and a simple per-process rate limit.
- Replaced the local keyword-only reply function with a request to the backend intelligence endpoint.
- Added authenticated voice transcription at `POST /api/n-atlas/transcribe`; audio is uploaded to the backend and forwarded to the N-ATLaS Kit `/v1/audio/transcriptions` endpoint. The browser never receives the gateway key.
- Replaced browser-native speech recognition with MediaRecorder capture and server-side N-ATLaS ASR. The transcript is placed in the message box for user review before sending.
- Added an explicit `NATLAS_DEMO_ENABLED=true` opt-in. The N-ATLaS routes return 503 by default when this flag is not enabled.

## Backend environment variables

For the private COUCH demo, set these only in the local `backend/.env` file (never in the customer-facing or production deployment environment):

```env
NATLAS_DEMO_ENABLED=true
NATLAS_BASE_URL=https://your-private-modal-gateway-url
NATLAS_API_KEY=your_server_side_n_atlas_gateway_key
NATLAS_MODEL=NCAIR1/N-ATLaS
```

`NATLAS_API_KEY` must never use a `VITE_` prefix and must never be placed in the vendor portal environment. `NATLAS_BASE_URL` must point to a real, authorized N-ATLaS Kit gateway. The documented demo gateway requires a key that is not included in the repository, so do not assume it is accessible. The endpoint returns a clear `503` if configuration is missing and does not silently pretend that a local response came from AI. The model name defaults to `NCAIR1/N-ATLaS`.

## API contract

`POST /api/n-atlas/chat`

Headers: the same existing vendor portal session token (`token` header) is used.

```json
{
  "message": "I have 20 goats to sell at 150000 naira each",
  "language": "en-NG",
  "history": []
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "reply": "...",
    "draft": {
      "name": "Goats",
      "category": "Livestock & Meat",
      "subcategory": "Goats",
      "quantity": "20",
      "unit": "piece",
      "price": "150000",
      "sourceText": "..."
    },
    "model": "NCAIR1/N-ATLaS"
  }
}
```

`draft` may be `null`. All draft fields must be reviewed by the farmer; the backend does not persist a draft or publish a listing.

`POST /api/n-atlas/transcribe` accepts `multipart/form-data` with `file` (audio recording) and `language` (`en-NG`, `ha-NG`, `ig-NG`, `yo-NG`, or `pcm-NG`). It uses the same vendor session token. Successful responses contain `data.text`, `data.language`, `data.model`, and an optional `data.notice`. The transcript is returned to the composer for review; it is not sent to chat automatically. Uploads are limited to 12 MB and are held in backend memory rather than saved as Elevoni files.

## Known limitations / next validation

- Text chat and ASR are routed through the private N-ATLaS Kit gateway. The frontend uses MediaRecorder and the backend forwards audio to the selected NCAIR1 ASR model. This does not prove transcription accuracy for real farmer recordings.
- Spoken playback remains browser/device speech synthesis. The N-ATLaS Kit serving gateway intentionally returns 501 for server-side TTS while model licensing is unresolved. Browser voice availability and pronunciation vary by device; it is not an N-ATLaS TTS result.
- Nigerian Pidgin has no dedicated ASR checkpoint in the supplied kit. Pidgin voice input is routed through Nigerian English ASR and is explicitly marked as potentially inaccurate. Pidgin chat is prompted through the English language hint.
- Context is a bounded snapshot for each request, not a complete analytics engine. Sales figures are self-reported unless the record says `verified`; the assistant must retain that distinction.
- Rate limiting is in-memory and per backend process. Production deployments with multiple instances should use a shared limiter (for example Redis) and platform-level request limits.
- Start the gateway privately for the demo and confirm `/health`, chat and ASR with an authorized key before claiming live N-ATLaS responses. The gateway URL is temporary when run in Modal development/serve mode; keep that process running during the demo.
- Review N-ATLaS licensing: the published terms state that commercial or large-scale enterprise use requires a separate licensing agreement. Confirm Elevoni's intended commercial use with Awarri before production launch.
- Configure usage budgets and monitor gateway costs before a public rollout.
- Do not claim live AI is enabled until the private gateway is running, `NATLAS_DEMO_ENABLED=true` is set in the local backend environment, the backend secret is configured, and real authenticated chat and ASR requests have succeeded.


## SDK integration notes

- Backend dependency: `n-atlas` JavaScript SDK (Node.js 20+ required by the SDK).
- Chat uses the SDK `NAtlas` client and its `chat()` method; no OpenAI, Gemini, or Claude fallback is configured.
- `NATLAS_BASE_URL` and `NATLAS_API_KEY` must be supplied by an authorized gateway operator. No API key is included.
- SDK language hints use `en`, `ha`, `ig`, and `yo`. Elevoni's Nigerian Pidgin selection currently maps to the English hint with a Pidgin response instruction; quality is not guaranteed and there is no dedicated Pidgin ASR model in the documented kit.
- The N-ATLaS Kit itself completed a private GPU-backed evaluation on 5 November 2026. The Elevoni-to-gateway integration in this ZIP has not yet been exercised end-to-end against that live gateway; complete the private demo runbook before claiming the integrated Elevoni flow works.


## Commercial-use gate (required before any public or commercial launch)

The N-ATLaS model licence is separate from the SDK's Apache-2.0 code licence. The supplied N-ATLAS Kit documentation says the model terms restrict commercial/enterprise deployment and specify a 1,000 active end-user cap. Elevoni is a registered business, so do not launch this model integration commercially until Awarri confirms in writing that Elevoni's intended use is authorized and any required licence is in place. Confirm the current authoritative model-card terms; this setup note is not legal advice.

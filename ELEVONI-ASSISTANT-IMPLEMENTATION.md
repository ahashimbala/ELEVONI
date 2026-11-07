# Elevoni Assistant — production implementation and operations guide

## Overview

Elevoni Assistant is Elevoni's farmer- and buyer-facing assistant. N-ATLaS provides language-model intelligence and Hausa, Igbo and Yoruba speech recognition/voice generation. The existing configured speech provider remains in use for English and Nigerian Pidgin. It has two experiences:

1. **Customer storefront** (`frontend`, `/assistant`): multilingual text/voice product discovery, navigation and buyer-to-listing matching.
2. **Vendor assistant** (`vendor-portal`): vendor questions, voice-assisted product listing submission, voice-based sales recording and summaries grounded in that vendor's own Elevoni records.

The customer assistant does not create orders, initiate payments, confirm stock or promise delivery. The `/elevoni-assistant`, `/tinka` and `/konekta` customer URLs redirect to `/assistant` for existing bookmarks; `VITE_TINKA_ENABLED` and `VITE_KONEKTA_ENABLED` are accepted temporarily as legacy aliases for `VITE_ELEVONI_ASSISTANT_ENABLED`. It searches approved, available listings and directs the customer to existing product/enquiry flows. The assistant does not invent suppliers, stock or prices.

## Farmer-first interface and voice

- Plain-language prompts, large touch targets and a prominent circular microphone control.
- Nigerian English, Nigerian Pidgin, Hausa, Igbo and Yoruba language choices.
- Voice input uses the device microphone through MediaRecorder, then uploads the recording to the Elevoni backend. Hausa, Igbo and Yoruba are routed to N-ATLaS ASR; English and Nigerian Pidgin use the existing configured provider. The transcript is placed in the composer for the user to review before sending.
- Each assistant response has a Play/Stop voice-message control immediately below it.
- Playback routes Hausa, Igbo and Yoruba through N-ATLaS TTS and English/Pidgin through the existing configured provider. Browser/device SpeechSynthesis fallback is disabled by default; it can be explicitly enabled for a build with `VITE_ALLOW_DEVICE_TTS_FALLBACK=true`.
- Pidgin transcription uses Nigerian English recognition and may miss Pidgin expressions. Pidgin speech uses an explicitly configured voice ID or an English-voice approximation; do not claim dedicated Pidgin support without native-speaker validation.
- The authorized N-ATLaS gateway must expose `/v1/audio/transcriptions` and `/v1/audio/speech` for Hausa, Igbo and Yoruba. Retain Awarri's written confirmation covering these speech services and their rolling 30-day user condition.
- Farmers can describe a product listing by voice. The assistant extracts the details, asks for missing required information, and shows an editable draft. Only after explicit confirmation does the vendor portal call the existing product-creation endpoint; the product enters `pending` administrative review and is not immediately public.
- Farmers can describe a sale by voice. The assistant extracts product, quantity, unit price, date, channel and payment details, asks for missing required information, calculates the total and balance, and shows an editable draft. Only after explicit confirmation does the portal call the existing vendor-sales endpoint. The record remains farmer-reported and unverified.
- Existing backend validation and vendor authorization remain authoritative. The model cannot publish products, create sales records, set verification status, or bypass admin approval.

## Matching and data safeguards

N-ATLaS interprets the buyer's words into structured criteria. Database filtering and ranking determine the results.

Marketplace results must be approved products, marked available, not marked out of stock, and owned by approved vendor profiles. Category, subcategory, location and explicit comparable per-unit price limits are applied when supplied. Quantity is only treated as sufficient when a positive recorded stock quantity and the requested unit are comparable. Otherwise the UI says stock is unconfirmed. The customer's location is not inferred; ask them to state their town/state where location matters.

Elevoni's direct smoked-catfish catalogue is searched separately. Tiered prices are shown as starting prices where appropriate and must be confirmed for the customer's quantity.

Elevoni has confirmed with Awarri that the relevant threshold is **no more than 1,000 active end users within a rolling 30-day period**. The implementation admits up to 1,000 unique active users. Retain the original written confirmation with Elevoni's licensing/partnership records and follow any more specific definition in that correspondence.


The backend now enforces the threshold using MongoDB as the source of truth:

- A unique person is counted on their first valid N-ATLaS chat, ASR or TTS request while active in the rolling 30-day window. N-ATLaS voice requests for Hausa, Igbo and Yoruba count toward the same allowance. English and Pidgin speech retain their configured provider. A valid request counts at admission even if the upstream model subsequently fails; malformed and rate-limited requests do not count.
- Authenticated Elevoni users are identified by their account ID across the customer and vendor assistant routes.
- Visitors who are not signed in receive a random first-party browser UUID stored in local storage. The backend HMAC-hashes it before storing it. No message text, phone number, email or raw identifier is stored in the usage ledger.
- Anonymous visitors who clear site storage, use another browser or change devices may be counted again. People sharing one browser without separate accounts may be counted as one anonymous identity. This is an explicit limitation; there is no invasive device fingerprinting.
- The rolling counter is a single MongoDB document updated atomically. Concurrent requests cannot admit more than 1,000 active unique users. At 1,000, existing active users can continue but new users are blocked; the 1,001st active identity is not admitted. Elevoni's normal marketplace, enquiries and checkout remain available. New-user admission resumes when the rolling count drops below 1,000.
- Daily unique-user events support the admin report and expire after 90 days. The backend does not depend on GA4, manual counts or frontend-only checks for enforcement.

The admin dashboard exposes **N-ATLaS Usage Monitor** at `/natlas-usage`, with the current rolling count, remaining new-user admission slots (maximum 1,000), daily active and new users, peak daily active users, users expiring within 24 hours, blocked requests and measurement timestamps. At 1,000, the dashboard shows that new-user admission is paused while existing users remain active. It is protected by the existing admin authentication.

### Backend environment variables

Set these in the backend's production environment (Vercel project settings or the hosting provider), not in the frontend:

```env
NATLAS_ENABLED=true
NATLAS_USAGE_HMAC_SECRET=<random secret of at least 32 characters>
NATLAS_BASE_URL=https://<authorized-n-atlas-gateway>
NATLAS_API_KEY=<server-side gateway key>
NATLAS_MODEL=NCAIR1/N-ATLaS
MONGO_URI=<production MongoDB connection string>
JWT_SECRET=<existing Elevoni JWT secret>
```

Generate it with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. `NATLAS_BASE_URL` must be the gateway origin without a `/v1` suffix. `NATLAS_USAGE_HMAC_SECRET` must be a dedicated, random secret and should remain stable. Rotating it changes the hashes used for visitor identity and can cause previously active users to be counted again during the next 30 days. Keep it private and back it up securely. Never expose `NATLAS_API_KEY` or `NATLAS_USAGE_HMAC_SECRET` in a `VITE_` variable.

`NATLAS_ENABLED` is enabled by default unless explicitly set to `false`; set it explicitly to `true` in production. The gate fails closed if the MongoDB connection or production HMAC secret is unavailable.

### Frontend environment variables

Set in the storefront's production build environment:

```env
VITE_ELEVONI_ASSISTANT_ENABLED=true
VITE_API_BASE_URL=https://<your-elevoni-backend-domain>
```

`VITE_ELEVONI_ASSISTANT_ENABLED` controls whether the public route and navigation links are included in the frontend build. Rebuild/redeploy the frontend after changing it.

### API routes

Customer storefront:

- `POST /api/n-atlas/customer/chat`
- `POST /api/n-atlas/customer/transcribe`
- `POST /api/n-atlas/customer/speech`

Approved vendor assistant:

- `POST /api/n-atlas/chat`
- `POST /api/n-atlas/transcribe`
- `POST /api/n-atlas/speech`

Admin reporting:

- `GET /api/admin/natlas-usage` (admin authentication required)

Customer requests include `X-Elevoni-Visitor-ID`. N-ATLaS chat, ASR and TTS requests for Hausa, Igbo and Yoruba pass through the same rolling usage-admission gate. When an Elevoni login token is available, the storefront also sends the existing `token` header so authenticated customers are counted by account ID instead of browser UUID. CORS explicitly allows the visitor-ID header.

## Deployment checklist

1. Confirm the written Awarri condition and retain the original correspondence. The production implementation assumes the agreed cap is 1,000 unique N-ATLaS users in any rolling 30-day period. The first production ledger starts empty; it does not import usage from the earlier private preview. Reconcile any people who already used N-ATLaS during the same rolling window before go-live, and confirm with Awarri whether those earlier tests count.
2. Confirm the production MongoDB database is a supported MongoDB deployment and that the backend can create/use the `natlasusagecounters` and `natlasusageevents` collections and indexes.
3. Configure `NATLAS_ENABLED=true`, `NATLAS_USAGE_HMAC_SECRET`, `NATLAS_BASE_URL`, `NATLAS_API_KEY`, `NATLAS_MODEL`, `MONGO_URI` and the existing `JWT_SECRET` in backend production settings.
4. Configure `VITE_ELEVONI_ASSISTANT_ENABLED=true` and the production `VITE_API_BASE_URL` in the storefront project, then rebuild/redeploy.
5. Confirm backend `/api/health` and admin login. Open Admin → N-ATLaS Usage and confirm an empty/low starting count.
6. Send an Elevoni Assistant text request as an anonymous browser visitor. Confirm one active N-ATLaS user is added. Repeat messages, transcribe speech and play spoken replies in Hausa, Igbo and Yoruba; the same identity must remain one active user. English and Pidgin use their configured speech provider.
7. Sign in as a customer in the same browser and repeat. Confirm the anonymous UUID is merged into the authenticated account identity so the user is not counted twice. Test a separate browser/device to understand the documented anonymous-identity limitation.
8. Test the vendor assistant. Confirm the same account is not double-counted between storefront and vendor assistant.
9. Test voice recording, N-ATLaS ASR transcript review and N-ATLaS TTS Play/Stop for Hausa, Igbo and Yoruba, plus the configured English/Pidgin provider, unavailable-language messaging and microphone permission denial on actual Android/iOS browsers.
10. In a non-production test database, seed 999 active identities, verify one new identity is admitted (bringing the count to 1,000), verify the next new identity is blocked, and verify an existing active identity remains allowed. Then age one identity beyond 30 days and verify a new identity can be admitted.
11. Confirm the admin dashboard reports the same count and blocked request totals. Test concurrent requests from separate backend instances against the same MongoDB deployment.
12. Monitor Modal cold starts, GPU costs, N-ATLaS chat latency, N-ATLaS ASR/TTS latency for Hausa, Igbo and Yoruba; configured-provider latency for English and Pidgin, provider costs and error rates after deployment.

## Known limits and validation

- The usage gate counts authenticated account IDs and anonymous browser UUIDs on N-ATLaS chat, ASR and TTS requests. Anonymous visitors can be counted more than once if they clear storage or change browsers/devices; multiple people sharing one browser without separate accounts can be counted as one. The code intentionally avoids fingerprinting.
- Anonymous-to-account merging works when the same Elevoni Assistant browser UUID accompanies an authenticated N-ATLaS chat request. It cannot link anonymous activity from a different browser/device, or anonymous use on the separate vendor portal origin, unless the account identity was already present.
- The MongoDB single-document admission gate is atomic. It requires the backend's MongoDB deployment to support the update-pipeline operators used by the gate; verify this against the production cluster before launch. The inclusive threshold allows up to 1,000 unique active users; the 1,001st unique user is blocked.
- Daily activity is UTC-based. The 30-day gate uses an exact 30 × 24-hour rolling window from the current request time.
- N-ATLaS voice availability depends on the authorized gateway exposing ASR and TTS for Hausa, Igbo and Yoruba. English and Pidgin voice availability depends on the configured existing speech provider. Native-speaker pronunciation validation is required for all supported languages.
- Browser/device SpeechSynthesis fallback is disabled by default and is only enabled with an explicit frontend build flag.
- Full end-to-end validation requires the live MongoDB, production backend, authorized Modal endpoint and real Android/iOS microphone/playback tests. Do not treat syntax checks or unit tests as a substitute for that deployment validation.


## Existing English and Pidgin cloud voice configuration

Set these values in the backend environment only. Never expose `ELEVENLABS_API_KEY` or voice-provider credentials in frontend `VITE_` variables.

```env
ELEVENLABS_API_KEY=<server-side API key>
ELEVENLABS_STT_MODEL=scribe_v2
ELEVENLABS_TTS_MODEL=eleven_v3
ELEVENLABS_ENGLISH_VOICE_ID=<voice ID>
ELEVENLABS_PIDGIN_VOICE_ID=<optional Pidgin voice ID; otherwise English voice is used with a notice>

```

ElevenLabs is retained for English and Nigerian Pidgin only. Pidgin transcription uses Nigerian English recognition and may miss Pidgin expressions. The three indigenous-language speech routes use the authorized N-ATLaS gateway.

The voice IDs must be selected and tested in the user's ElevenLabs account. Do not invent voice IDs or claim local-language pronunciation quality without native-speaker validation. Commercial use must comply with the applicable ElevenLabs paid-plan and API terms; the Free plan does not grant commercial usage rights. Check the account plan, voice rights and data-retention terms before production use.

Hausa, Igbo and Yoruba voice audio is sent to the authorized N-ATLaS gateway; English and Pidgin audio is sent to the configured existing speech provider. Update Elevoni's privacy disclosures to reflect the actual provider and retention settings for each language.

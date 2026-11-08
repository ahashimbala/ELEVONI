# N-ATLaS / Elevoni Assistant implementation notes — 7 November 2026

This note supersedes earlier private-evaluation-only deployment instructions.

- Elevoni Assistant has a customer storefront experience and a separate authenticated vendor assistant.
- N-ATLaS chat is enabled with `NATLAS_ENABLED=true` and a MongoDB rolling 30-day active-user gate.
- Hausa, Igbo and Yoruba speech recognition route through N-ATLaS. Their speech-generation route attempts the authorized N-ATLaS gateway first, then a language-specific ElevenLabs voice only when its dedicated voice ID is configured. English and Nigerian Pidgin use ElevenLabs with dedicated voice IDs; Pidgin must not borrow an English voice.
- The code contains TTS integrations, but that does not prove a native voice is provisioned or that the live Awarri gateway exposes working speech generation. Test each language against the authorized gateway and native speakers before advertising voice playback as available.
- One atomic MongoDB counter prevents concurrent backend instances from admitting more than 1,000 active unique users. At 1,000, existing active users can continue while new identities are blocked; a 1,001st active identity is not admitted.
- Authenticated users are identified by account ID. Anonymous visitors use a persistent first-party browser UUID. The backend stores only an HMAC hash of that identifier.
- Vendor voice routes require an authenticated, approved vendor profile. Customer routes support authenticated and anonymous visitors with a first-party visitor ID.
- The vendor assistant can prepare product listing drafts and farmer-reported sales drafts conversationally. Farmers review and explicitly confirm before the existing product or sales API is called.
- Product submissions remain pending until administrative approval. Sales records remain farmer-reported and unverified unless separately verified through Elevoni's existing process.
- Admin reporting is available at `/api/admin/natlas-usage` and in the admin UI at `/natlas-usage`.
- Storefront builds must set `VITE_ELEVONI_ASSISTANT_ENABLED=true`. Backend production must set `NATLAS_ENABLED=true`, a stable `NATLAS_USAGE_HMAC_SECRET` (32+ characters), MongoDB URI and private N-ATLaS gateway credentials.
- The private N-ATLaS gateway must expose `/v1/audio/transcriptions` and `/v1/audio/speech` for Hausa, Igbo and Yoruba. The speech route must return a non-empty audio response in the requested language. Verify both routes on the authorized production gateway before enabling those voice features.
- Customer product matching remains deterministic after model intent extraction: only approved, available marketplace listings and the visible Elevoni direct smoked-catfish catalogue are considered. The customer assistant does not place orders or initiate payments.

See `ELEVONI-ASSISTANT-IMPLEMENTATION.md`, `N-ATLAS-NOTICE.md` and `ELEVONI-ASSISTANT-VOICE-ACTIONS-UPDATE.md` for the operational design and deployment checklist.


## Provider migration note — 2026-11-08

The live Elevoni Assistant routes have been migrated in source to OpenAI for text intelligence and speech transcription. ElevenLabs remains the speech-generation provider. The former N-ATLaS 1,000-user middleware is no longer attached to the customer or vendor assistant routes. Historical N-ATLaS usage records and the admin history page are retained for audit only. Awarri/N-ATLaS is no longer credited as the live assistant provider.

OpenAI credentials are configured with `OPENAI_API_KEY` in the backend environment only. The default model is `gpt-6.1-sol`; the transcription model is `gpt-transcribe`. These defaults are configurable through backend environment variables. Pidgin transcription uses an English language hint with an explicit Nigerian Pidgin prompt and must be validated with native speakers. Do not claim language quality without testing.

ElevenLabs voice generation requires a separate voice ID for each selected language. No language may silently borrow another language's voice. Missing voice IDs should produce an explicit unavailable-voice response while leaving the text response readable.

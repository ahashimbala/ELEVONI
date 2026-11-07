# N-ATLaS / Elevoni Assistant implementation notes — 7 November 2026

This note supersedes earlier private-evaluation-only deployment instructions.

- Elevoni Assistant is the public Elevoni assistant brand, with a customer storefront experience and a separate authenticated vendor assistant.
- Customer and vendor N-ATLaS chat routes are subject to `NATLAS_ENABLED=true` and the rolling user gate. ElevenLabs voice routes are separate; vendor voice routes still require an authenticated, approved vendor profile.
- Awarri has confirmed in writing that the 1,000-user condition applies to N-ATLaS users. The backend now counts unique active N-ATLaS identities over an exact rolling 30-day window using MongoDB. It no longer relies on manually supplied environment counts or a private-evaluation access key.
- Authenticated users are identified by account ID. Anonymous visitors use a persistent first-party browser UUID. The backend stores only an HMAC hash of that identifier.
- One atomic MongoDB counter prevents concurrent requests across backend instances from admitting more than 999 active unique users. At 999, existing active users remain able to use N-ATLaS but new users are blocked; at 1,000 or more, all N-ATLaS chat requests are blocked until the count falls below 1,000. New-user admission resumes only when the count is below 999.
- Admin reporting is available at `/api/admin/natlas-usage` and in the admin UI at `/natlas-usage`.
- Storefront builds must set `VITE_ELEVONI_ASSISTANT_ENABLED=true`. Backend production must set `NATLAS_ENABLED=true`, a stable `NATLAS_USAGE_HMAC_SECRET` (32+ characters), the MongoDB URI and the private N-ATLaS gateway credentials.
- Voice input uses MediaRecorder and ElevenLabs Scribe v2 cloud ASR; each transcript is reviewed before sending. Response playback uses configured ElevenLabs cloud TTS. Browser/device SpeechSynthesis fallback is disabled by default. N-ATLaS server-side TTS is not used because the optional voice checkpoints have separate CC BY-NC 4.0 restrictions.
- Matching remains deterministic after model intent extraction: only approved, available marketplace listings and the visible Elevoni direct smoked-catfish catalogue are considered. No order/payment action is performed by Elevoni Assistant.

See `ELEVONI-ASSISTANT-IMPLEMENTATION.md` and `N-ATLAS-NOTICE.md` for the operational design, limitations and deployment checklist.

- ElevenLabs voice calls are independent of the N-ATLaS user allowance. The MongoDB rolling 30-day cap is applied to actual N-ATLaS chat requests, not the ElevenLabs ASR/TTS calls.
- Configure the server-only ElevenLabs API key and language-specific voice IDs as documented in `ELEVONI-ASSISTANT-IMPLEMENTATION.md`.

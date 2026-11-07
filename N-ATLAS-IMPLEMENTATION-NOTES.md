# N-ATLaS / Elevoni Assistant implementation notes — 7 November 2026

This note supersedes earlier private-evaluation-only deployment instructions.

- Elevoni Assistant has a customer storefront experience and a separate authenticated vendor assistant.
- N-ATLaS chat is enabled with `NATLAS_ENABLED=true` and a MongoDB rolling 30-day active-user gate.
- Hausa, Igbo and Yoruba speech recognition and voice generation route through N-ATLaS and count toward the same rolling 30-day allowance as chat. English and Nigerian Pidgin retain their configured speech provider.
- One atomic MongoDB counter prevents concurrent backend instances from admitting more than 1,000 active unique users. At 1,000, existing active users can continue while new identities are blocked; a 1,001st active identity is not admitted.
- Authenticated users are identified by account ID. Anonymous visitors use a persistent first-party browser UUID. The backend stores only an HMAC hash of that identifier.
- Vendor voice routes require an authenticated, approved vendor profile. Customer routes support authenticated and anonymous visitors with a first-party visitor ID.
- The vendor assistant can prepare product listing drafts and farmer-reported sales drafts conversationally. Farmers review and explicitly confirm before the existing product or sales API is called.
- Product submissions remain pending until administrative approval. Sales records remain farmer-reported and unverified unless separately verified through Elevoni's existing process.
- Admin reporting is available at `/api/admin/natlas-usage` and in the admin UI at `/natlas-usage`.
- Storefront builds must set `VITE_ELEVONI_ASSISTANT_ENABLED=true`. Backend production must set `NATLAS_ENABLED=true`, a stable `NATLAS_USAGE_HMAC_SECRET` (32+ characters), MongoDB URI and private N-ATLaS gateway credentials.
- The private N-ATLaS gateway must expose `/v1/audio/transcriptions` and `/v1/audio/speech` for Hausa, Igbo and Yoruba. Verify both routes on the authorized production gateway before enabling voice features.
- Customer product matching remains deterministic after model intent extraction: only approved, available marketplace listings and the visible Elevoni direct smoked-catfish catalogue are considered. The customer assistant does not place orders or initiate payments.

See `ELEVONI-ASSISTANT-IMPLEMENTATION.md`, `N-ATLAS-NOTICE.md` and `ELEVONI-ASSISTANT-VOICE-ACTIONS-UPDATE.md` for the operational design and deployment checklist.

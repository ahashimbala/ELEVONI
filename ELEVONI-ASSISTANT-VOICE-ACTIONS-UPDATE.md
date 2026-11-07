# Elevoni Assistant — Voice Actions Update

## What changed

- Added structured `salesDraft` extraction alongside product `draft` extraction in the vendor assistant.
- Added farmer-reviewable product and sales cards in the vendor portal.
- Product listing submission calls the existing `/api/products/vendor` endpoint only after the farmer confirms. The existing controller sets status to `pending`; no assistant-generated listing is published directly.
- Sales recording calls the existing `/api/vendor/sales` endpoint only after explicit confirmation. The existing sales service calculates totals and enforces payment rules. Records remain `recordSource: farmer_reported` and `verificationStatus: unverified`.
- Missing fields are left blank for the assistant to clarify; model output is validated before reaching the UI and existing backend validators remain authoritative.
- Added a dedicated “Record a sale” suggested action.
- Routed Hausa (`ha-NG`), Igbo (`ig-NG`) and Yoruba (`yo-NG`) transcription and speech through N-ATLaS for both vendor and customer assistant routes. English and Nigerian Pidgin retain their configured speech provider.
- N-ATLaS speech recognition and speech generation requests are admitted through the same rolling 30-day user ledger as chat.
- Fixed the MongoDB `$expr` + upsert incompatibility by creating the singleton usage counter separately, then performing the guarded atomic admission update with `upsert: false`.
- Fixed the missing `NATLAS_USER_LIMIT` named export import in the middleware.
- Updated the usage rule to the confirmed inclusive allowance: up to 1,000 active end users. Existing active users can continue at 1,000; a 1,001st new identity is blocked.

## Safety and data integrity

- No product is submitted without an explicit farmer confirmation.
- Product submissions remain pending administrative approval.
- No sales record is saved without explicit farmer confirmation.
- Sales records remain farmer-reported and unverified.
- The assistant must not invent prices, quantities, payment amounts, dates, stock, buyer identity or location.
- The existing product and sales endpoints perform the final authorization and validation.
- N-ATLaS user identities continue to be HMAC-hashed in the usage ledger.

## Environment and gateway requirements

- Keep `NATLAS_ENABLED=true` and configure `NATLAS_USAGE_HMAC_SECRET`, `NATLAS_BASE_URL` and `NATLAS_API_KEY` in the backend environment.
- The private N-ATLaS gateway must expose `/v1/audio/transcriptions` and `/v1/audio/speech` for Hausa, Igbo and Yoruba. The current speech adapter expects the speech endpoint to accept `{ input, language }` and return an audio response. Confirm this against the exact Awarri gateway deployment.
- `ELEVENLABS_API_KEY` and its voice settings remain necessary only for the existing English/Pidgin speech paths. Do not remove them until those paths have been separately migrated and tested.

## Verification performed in this package

- Node syntax checks passed for the changed backend modules and routes.
- Targeted unit tests passed for N-ATLaS usage rules and listing/sales draft validation.
- TypeScript JSX parsing passed for the changed vendor assistant and customer assistant components.
- Full backend test suite, production Vite builds, live MongoDB concurrency tests, live Awarri gateway calls and native-device audio tests were not run in this environment. Complete those before production rollout.

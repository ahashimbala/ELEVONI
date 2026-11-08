# Elevoni Daily Assistant Limit — Implementation Report

## Behaviour

- Both the customer storefront assistant and the authenticated vendor assistant share a daily limit of **10 submitted chat prompts per user**.
- The 11th prompt is rejected with HTTP `429` and code `ASSISTANT_DAILY_LIMIT_REACHED`.
- Public-facing message: `You've reached the daily limit for the agriculture assistant prototype. Please come back tomorrow.`
- The quota resets at midnight in `Africa/Lagos` by default.
- Authenticated customers and vendors are keyed by their account ID, so the limit is shared across both assistants and devices.
- Anonymous storefront visitors receive a persistent browser UUID in local storage and send it in `X-Elevoni-Visitor-ID`. Requests without a valid visitor ID fall back to a hashed network identity.
- Voice transcription checks that a prompt remains available, but does not consume a prompt by itself. The chat request consumes it when the transcribed text is submitted.
- Speech playback is not blocked, so a user can still listen to the response to their 10th prompt.
- Existing short-window throttles remain in place.

## Production implementation

- Daily usage is persisted in MongoDB (`assistantdailyusages`), not an in-memory map. This works across Vercel/serverless instances and restarts.
- A unique `{ identityHash, dayKey }` index and 45-day TTL index are ensured by the backend before usage is read or written.
- Raw account IDs, visitor IDs and IP addresses are not stored. The identity is HMAC-SHA256 hashed.
- `ASSISTANT_USAGE_HMAC_SECRET` is required in production; the old `NATLAS_USAGE_HMAC_SECRET` is accepted as a migration fallback. Use a random secret with at least 32 characters.
- `ASSISTANT_DAILY_LIMIT_TIME_ZONE=Africa/Lagos` is the default daily boundary.

## Changed files

- `backend/models/assistantDailyUsage.js`
- `backend/services/assistantDailyLimit.js`
- `backend/controllers/nAtlasController.js`
- `backend/controllers/nAtlasCustomerController.js`
- `backend/middleware/apiCors.js`
- `backend/.env.example`
- `backend/tests/assistant-daily-limit.test.js`
- `backend/tests/assistant-daily-limit-routing.test.js`
- `frontend/src/pages/ElevoniAssistant/ElevoniAssistant.jsx`
- `vendor-portal/src/api.js`
- `shared/assistantVisitor.mjs`

## Verification

- 10 focused daily-limit and routing tests passed.
- Backend service/model/controller syntax checks passed.
- Vendor API and shared visitor helper syntax checks passed.
- Full backend test suite was attempted but could not complete because the working copy's `node_modules` contained incomplete/empty package directories. `npm ci --no-audit --no-fund` timed out in this environment. A full production build and live MongoDB test have therefore not been claimed.

## Deployment checklist

1. Merge the patch into the existing `C:\Users\User\Desktop\ELEVONI` project, preserving the folder structure and allowing the listed files to overwrite.
2. In the **backend Vercel project only**, set `ASSISTANT_USAGE_HMAC_SECRET` to a newly generated random value of at least 32 characters. If the backend already has `NATLAS_USAGE_HMAC_SECRET`, it can serve as a temporary fallback, but the dedicated variable is preferred.
3. Set `ASSISTANT_DAILY_LIMIT_TIME_ZONE` to `Africa/Lagos` (optional; this is already the code default).
4. Redeploy the backend before deploying the frontend and vendor portal.
5. Confirm the MongoDB backend role can create indexes on the new `assistantdailyusages` collection.
6. Test 10 prompts from one account, confirm prompt 11 receives the 429 message, and confirm the quota resets after Lagos midnight.

## Important scope note

This is a daily product-usage cap, not a complete anti-abuse or DDoS system. The existing short-window throttles remain. Anonymous users can reset a browser-local identity by clearing site storage; authenticated account limits remain stable across sessions.

# Elevoni Assistant — language, guided collection and voice fallback update

## Changes

- Vendor product-listing and sales-record draft panels no longer show long editable forms. They show a compact summary while N-ATLaS asks for missing required details one question at a time in the conversation. Farmers answer in the chat composer. The existing explicit confirmation actions remain the only way to submit a listing or save a sales record.
- Vendor and customer assistant system prompts now state the selected language as a strict response-language constraint. They explicitly prohibit silent language switching and multiple follow-up questions in one response.
- Changing language starts a fresh conversation and clears stale language-specific messages; the vendor assistant also clears any in-progress listing or sales draft.
- Cloud TTS failure now falls back to browser speech synthesis automatically when the browser supports it. The fallback requests the selected locale and no longer forces an unrelated default voice. A device without a matching voice may still pronounce the selected language imperfectly.
- Vendor send button now uses the storefront's prominent sage send-button treatment and labelled Send control.
- Vendor portal layout already includes a visible “N-ATLaS voice technology powered by Awarri Technologies” footer attribution; it remains in place.

## Files changed

- `backend/services/nAtlasIntelligence.js`
- `backend/services/nAtlasCustomer.js`
- `frontend/src/pages/ElevoniAssistant/ElevoniAssistant.jsx`
- `vendor-portal/src/pages/NAtlas/NAtlas.jsx`
- `vendor-portal/src/pages/NAtlas/NAtlas.css`

## Verification

- Backend targeted tests: 21 passed (`natlas-customer`, `elevenlabs-voice`, `natlas-response`).
- JSX transpile/parser checks passed for both assistant pages.
- CSS brace checks passed for the changed vendor assistant stylesheet.
- `node --check` passed for both changed backend service files.
- Full frontend/vendor production builds, real N-ATLaS language-quality testing, and live Awarri/ElevenLabs speech tests were not run. Language quality and voice availability still require tests with native speakers and the configured live providers.

## Important behaviour

- The server remains authoritative for product validation, sales calculations, and saving.
- Listings are still submitted for administrative review; they are not automatically published.
- Sales remain farmer-reported and unverified unless independently verified.
- No provider credentials or `.env` files were added to the archive.

# Elevoni Assistant: voice diagnostics, catalogue sources and navigation update

## Changes in this update

### Provider transparency
- Customer storefront assistant displays `AI by OpenAI · Voice by ElevenLabs` (already present in this source).
- Vendor assistant now displays the same attribution beneath its composer; the vendor workspace footer attribution is retained.

### Voice failure diagnostics
- Customer and vendor assistants now read JSON error responses returned as blobs by the speech endpoint.
- When ElevenLabs fails and the device has no matching local voice, the user sees the backend/provider explanation instead of only a generic combined error.
- If a matching device voice exists, the app can still use it as a fallback and explicitly says that it is using the device voice.
- ElevenLabs Multilingual v2 requests omit `language_code`, because that model does not accept that parameter.
- The backend still requires a dedicated server-side voice ID for each selected language. The ZIP excludes `.env` files, so deployed voice IDs and actual account entitlements cannot be verified from source.

### Elevoni Direct and Marketplace distinction
- Customer catalogue overview requests (for example, "What products are available on Elevoni?") are classified as an overview.
- The customer assistant now queries:
  - visible `fish` catalogue records with `vendorId: null` as Elevoni Direct products;
  - approved, available `Product` records with `vendorId: null` as other Elevoni Direct products;
  - approved, available listings belonging to approved vendor profiles as Marketplace listings.
- Each result includes `sourceType` and `sourceLabel`; the storefront shows an Elevoni Direct or Marketplace listing label.
- The overview response reports the two sources separately and reminds customers to confirm live stock, final price and delivery.
- The vendor assistant grounding now includes Elevoni Direct products separately from its own vendor products and approved Marketplace listings. Its instructions explicitly prevent mixing those sources.

### Vendor mobile navigation
- The vendor bottom navigation is inset from the screen edges and raised slightly from the bottom edge, leaving visible white space below it.
- Existing navigation items and storefront spacing are otherwise preserved.

### Environment template
- `backend/.env.example` now uses `OPENAI_MODEL=gpt-4o-mini`, matching the model-aware request code in `openaiApi.js`.
- Voice ID variables remain blank placeholders and must be populated in local backend environment and Vercel backend environment separately.

## Validation

Passed:
- `node --check` for the changed backend service files.
- `backend/tests/natlas-customer.test.js`: 13/13.
- `backend/tests/elevenlabs-voice.test.js`: 10/10.

Not completed:
- Full backend test suite: 15 tests could not load because this source archive excludes `node_modules` (missing packages including `mongoose`, `dotenv` and `express`).
- Frontend and vendor portal production builds: dependencies are not included in the source archive, so Vite builds were not run.
- Live OpenAI/ElevenLabs API tests: require the user's credentials and deployed voice IDs.
- Native Igbo, Yoruba and Pidgin pronunciation quality: requires tests with the configured ElevenLabs voices and native speakers.

## Voice support caution

The frontend now surfaces the real provider error. This should be deployed before deciding whether a language needs a new voice ID, a different supported TTS model, or an alternative provider. Eleven v3's published language list includes Yoruba and Hausa but omits Igbo; ElevenLabs' Igbo product page separately advertises Igbo TTS. Confirm the exact API model and endpoint available to the account before treating Igbo cloud voice as supported. Nigerian Pidgin is not a separate ElevenLabs language code in this integration; it uses English normalization and must use a voice trained/tested for Nigerian Pidgin.

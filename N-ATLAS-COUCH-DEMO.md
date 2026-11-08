# N-ATLaS / Elevoni Assistant COUCH demonstration notes

This document began as a private COUCH demonstration runbook. The implementation has since moved to a public-production architecture with a MongoDB-enforced 1,000-user rolling 30-day cap. Use `ELEVONI-ASSISTANT-IMPLEMENTATION.md` for current production configuration and deployment instructions.

## Demonstration capabilities

- Vendor assistant: authenticated approved vendors can ask about their own products and bounded sales records, and prepare a product-listing draft for review.
- Customer Elevoni Assistant: buyers can use text or voice to discover real approved listings and navigate Elevoni's marketplace.
- Five language options are present: Nigerian English, Nigerian Pidgin, Hausa, Igbo and Yoruba. Language selection is not a claim that ASR/TTS quality is equally validated in all five languages.
- Buyer matching is deterministic after intent extraction and uses actual approved/available listing records. It does not invent suppliers, stock or prices.
- Hausa, Igbo and Yoruba voice recordings are transcribed through N-ATLaS; their speech generation attempts the authorized N-ATLaS gateway and may use a dedicated language-specific ElevenLabs voice if configured. English and Pidgin require their own configured ElevenLabs voices. Browser SpeechSynthesis fallback is used only when an exact matching language voice is installed. Transcripts are returned for user review. Live voice availability must be verified per language before claiming it is production-ready.

## Current usage controls

Awarri has confirmed in writing that the 1,000-user condition applies to N-ATLaS users. Backend usage is recorded in MongoDB as unique authenticated account IDs or HMAC-hashed anonymous browser UUIDs. A single atomic counter controls admission across customer and vendor N-ATLaS chat endpoints. Hausa, Igbo and Yoruba ASR/TTS requests use N-ATLaS and count toward the same allowance. At 1,000 active users in the rolling 30-day window, new unique users are blocked; existing active users can continue. The Admin UI includes an N-ATLaS Usage Monitor.

## Production environment

Backend:

```env
NATLAS_ENABLED=true
NATLAS_USAGE_HMAC_SECRET=<random secret of at least 32 characters>
NATLAS_BASE_URL=https://your-authorized-modal-gateway
NATLAS_API_KEY=<server-side-gateway-key>
NATLAS_MODEL=NCAIR1/N-ATLaS
MONGO_URI=<production-mongodb-uri>
```

Storefront build:

```env
VITE_ELEVONI_ASSISTANT_ENABLED=true
VITE_API_BASE_URL=https://your-elevoni-backend-domain
```

Never expose the gateway key or usage HMAC secret to frontend builds.

## Speech provider configuration

Hausa, Igbo and Yoruba ASR/TTS use the authorized N-ATLaS gateway under Awarri's confirmed 1,000-active-end-user rolling 30-day condition. English and Pidgin retain the configured speech provider. Confirm that the production gateway exposes both `/v1/audio/transcriptions` and `/v1/audio/speech` before enabling these voice routes.

## Before a live demonstration

1. Confirm the backend has MongoDB connected and the production usage HMAC secret configured.
2. Open the Admin → N-ATLaS Usage Monitor and verify that the current count is being read from MongoDB.
3. Warm the Modal gateway and verify one real chat and one ASR request.
4. Configure the existing English/Pidgin speech provider and confirm the N-ATLaS ASR/TTS endpoints for Hausa, Igbo and Yoruba on a phone with microphone permission enabled.
5. Test a product request such as `I need 50 chickens in Kano`; confirm results originate only from approved and available records.
6. Test a Food Crops request, a smoked-catfish request and a navigation request.
7. Play a response aloud in Hausa, Igbo, Yoruba, English and Pidgin; confirm the expected provider is used for each language.
8. Keep the limitations visible: no guaranteed stock, no order placement, no payment and no vendor reliability score unless supported by verified data.

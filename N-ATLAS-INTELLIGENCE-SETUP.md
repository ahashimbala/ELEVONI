# N-ATLaS intelligence integration

## Current implementation

- Authenticated `POST /api/n-atlas/chat` serves approved vendor profiles and grounds answers in the vendor's own product and sales records plus approved marketplace listings.
- Customer-facing routes are `POST /api/n-atlas/customer/chat`, `/transcribe` and `/speech`. Vendor routes are `POST /api/n-atlas/chat`, `/transcribe` and `/speech`.
- Hausa (`ha-NG`), Igbo (`ig-NG`) and Yoruba (`yo-NG`) ASR and TTS requests route through N-ATLaS. English and Nigerian Pidgin retain the configured speech provider.
- Voice transcripts are returned to the composer for review before they are sent to chat.
- The vendor assistant can create product listing drafts and sales-log drafts from conversation. It asks for missing information, shows the draft for farmer review, and saves only after explicit confirmation using Elevoni's existing product and vendor-sales APIs.
- Product listings enter the existing `pending` admin-review status. Sales records are saved as `farmer_reported` and `unverified`.
- The backend never exposes the N-ATLaS gateway API key to browser code.
- Customer product matching uses model-extracted criteria followed by deterministic database filtering and ranking against approved, available listings. The customer assistant does not create orders, confirm stock or initiate payments.

## Production usage limit

Awarri has confirmed a maximum of 1,000 active end users in a rolling 30-day period. Elevoni admits up to 1,000 unique N-ATLaS users. Chat, ASR and TTS requests for Hausa, Igbo and Yoruba are counted in the same MongoDB ledger. At 1,000 active users, existing users can continue but new identities are blocked. English and Pidgin speech remains on its configured provider.

Required backend variables:

```env
NATLAS_ENABLED=true
NATLAS_USAGE_HMAC_SECRET=<random secret of at least 32 characters>
NATLAS_BASE_URL=https://your-authorized-modal-gateway
NATLAS_API_KEY=<server-side gateway key>
NATLAS_MODEL=NCAIR1/N-ATLaS
MONGO_URI=<production MongoDB URI>
JWT_SECRET=<existing Elevoni JWT secret>
```

Never put `NATLAS_API_KEY` or `NATLAS_USAGE_HMAC_SECRET` in a frontend `VITE_` variable. Keep the HMAC secret stable; rotating it can cause anonymous identities to be counted again.

## Voice gateway contract

The backend expects the authorized gateway to expose:

- `POST /v1/audio/transcriptions`: multipart `file` and `language` (`ha`, `ig` or `yo`), returning JSON with `text`.
- `POST /v1/audio/speech`: JSON `{ "input": "...", "language": "ha|ig|yo" }`, returning an audio response.

Confirm both routes on the exact Awarri-authorized production gateway. The current implementation does not place gateway credentials in frontend code.

## Chat and action safety

The vendor chat response may contain `reply`, `draft` and `salesDraft`. These are untrusted model suggestions validated by the backend before display. The browser never saves a listing or sale automatically.

- Product listing confirmation calls the existing `POST /api/products/vendor` route. That route validates the vendor's approved profile and category permissions and sets the new product to `pending`.
- Sales-record confirmation calls the existing `POST /api/vendor/sales` route. That route validates quantities, unit price, totals, payment amount, date, sales channel and buyer identity. The saved record remains farmer-reported and unverified.
- The assistant must not invent prices, quantities, stock, dates, payment amounts, buyer details or locations. Missing required details remain blank and are asked conversationally.

## Operations

- Confirm the gateway `/health`, `/v1/models`, chat, ASR and TTS with an authorised key before production rollout.
- Monitor Modal cold starts, GPU costs, inference latency, ASR/TTS errors and request failures.
- Review the Admin → N-ATLaS Usage Monitor after deployment. MongoDB, not GA4 or a manually supplied count, is the enforcement source of truth.
- Complete the production validation checklist in `ELEVONI-ASSISTANT-IMPLEMENTATION.md` before treating the deployment as fully validated.

## Existing English/Pidgin provider environment

```env
ELEVENLABS_API_KEY=<backend-only API key>
ELEVENLABS_STT_MODEL=scribe_v2
ELEVENLABS_TTS_MODEL=eleven_v3
ELEVENLABS_ENGLISH_VOICE_ID=<voice ID>
ELEVENLABS_PIDGIN_VOICE_ID=<optional voice ID; English voice fallback is labelled>
```

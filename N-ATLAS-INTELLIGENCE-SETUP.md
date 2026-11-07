# N-ATLaS intelligence integration

## Current implementation

- Authenticated `POST /api/n-atlas/chat` serves approved vendor profiles. It grounds answers in the vendor's own product and sales records and a bounded set of approved marketplace listings.
- Customer-facing Elevoni Assistant routes are `POST /api/n-atlas/customer/chat`, `/transcribe` and `/speech`; the voice endpoints are served by ElevenLabs while `/chat` calls N-ATLaS.
- Vendor voice routes are `POST /api/n-atlas/transcribe` and `/speech`.
- Voice input uses MediaRecorder, uploads the recording to the backend, forwards it to ElevenLabs Scribe v2 and places the transcript in the composer for review before sending. N-ATLaS receives only the reviewed text chat request.
- Response playback uses ElevenLabs cloud speech generation through the backend. Browser/device SpeechSynthesis fallback is disabled by default and can only be enabled explicitly with `VITE_ALLOW_DEVICE_TTS_FALLBACK=true`.
- The backend never exposes the gateway API key to browser code.
- Customer product matching uses model-extracted criteria followed by deterministic database filtering and ranking against approved, available listings. Elevoni Assistant does not create orders, confirm stock or initiate payments.

## Production usage limit

Awarri has confirmed in writing that the 1,000-user condition applies to N-ATLaS users. Elevoni admits at most 999 unique N-ATLaS users in an exact rolling 30-day window using MongoDB. The usage gate applies to N-ATLaS chat requests; ElevenLabs ASR/TTS calls are independent and do not consume this allowance. See `ELEVONI-ASSISTANT-IMPLEMENTATION.md` for the data model, concurrency handling, anonymous identity limitations, admin dashboard and deployment checklist.

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

## Chat API contract

`POST /api/n-atlas/chat` uses the existing vendor portal session token and requires an approved vendor profile.

```json
{
  "message": "I have 20 goats to sell at 150000 naira each",
  "language": "en-NG",
  "history": []
}
```

A successful response contains `data.reply`, `data.draft` (which may be null) and `data.model`. Drafts are suggestions only; the farmer reviews and publishes them through existing Elevoni workflows.

`POST /api/n-atlas/transcribe` and `/api/n-atlas/customer/transcribe` accept `multipart/form-data` with `file` and `language`. The transcript is returned to the composer for review; it is not automatically sent to chat. Uploads are limited to 12 MB and are held in backend memory rather than saved as Elevoni files.

Speech routes accept JSON `{ "text": "...", "language": "en-NG" }` and return an audio response only when the relevant ElevenLabs cloud voice ID is configured. Otherwise the route returns a clear unavailable response. Browser/device speech fallback is disabled by default.

## Voice licence limitation

The supplied Kit keeps `NATLAS_ENABLE_TTS=false` by default. Its optional Soro-TTS/MMS-TTS checkpoints have separate CC BY-NC 4.0 restrictions. Awarri's N-ATLaS usage confirmation does not automatically grant commercial/public rights to those TTS checkpoints. Elevoni Assistant uses ElevenLabs for cloud TTS instead. ElevenLabs language-specific voice IDs and paid-plan commercial rights must be confirmed before production use.

Nigerian Pidgin is routed through ElevenLabs Nigerian English recognition and may be inaccurate for Pidgin. It is not represented as a dedicated Pidgin ASR model. Igbo cloud speech generation is configured experimentally; native-speaker pronunciation validation remains required.

## Operations

- Confirm the Modal gateway `/health`, `/v1/models`, chat and ASR with an authorised key before production rollout.
- Monitor Modal cold starts, GPU costs, inference latency, ASR errors and request failures.
- Review the Admin → N-ATLaS Usage Monitor daily after deployment. MongoDB, not GA4 or a manually supplied count, is the enforcement source of truth.
- Use the production validation checklist in `ELEVONI-ASSISTANT-IMPLEMENTATION.md` before treating the deployment as fully validated.

## ElevenLabs environment

```env
ELEVENLABS_API_KEY=<backend-only API key>
ELEVENLABS_STT_MODEL=scribe_v2
ELEVENLABS_TTS_MODEL=eleven_v3
ELEVENLABS_ENGLISH_VOICE_ID=<voice ID>
ELEVENLABS_PIDGIN_VOICE_ID=<optional voice ID>
ELEVENLABS_HAUSA_VOICE_ID=<voice ID>
ELEVENLABS_YORUBA_VOICE_ID=<voice ID>
ELEVENLABS_IGBO_VOICE_ID=<Igbo-capable voice ID>
```

Only N-ATLaS chat calls pass through the rolling 30-day N-ATLaS user gate. ElevenLabs transcription and speech generation have separate request rate limits and do not increment the N-ATLaS user counter.

# Elevoni Assistant — OpenAI + ElevenLabs implementation guide

## Provider architecture

The live Elevoni Assistant uses:

- **OpenAI Responses API** for customer and vendor assistant intelligence.
- **OpenAI GPT-Transcribe** for speech-to-text in the selected language.
- **ElevenLabs** for speech generation, using a dedicated server-side voice ID for each language.
- **Elevoni's backend and MongoDB** for authentication, vendor/customer context, listing validation, sales calculations, permissions and persistence.

The previous N-ATLaS model, ASR/TTS gateway and rolling 30-day 1,000-user admission middleware are no longer attached to the live assistant routes. Historical N-ATLaS usage records and the admin history screen remain for audit purposes only. They do not limit OpenAI-powered assistant access.

The existing API paths `/api/n-atlas/...` are retained as compatibility aliases for old clients. The current frontends use provider-neutral paths:

- Customer: `/api/assistant/customer/chat`, `/transcribe`, `/speech`.
- Vendor: `/api/assistant/vendor/chat`, `/transcribe`, `/speech`.

## Assistant behaviour

### Customer storefront

The customer assistant helps with product discovery, marketplace navigation and buyer-to-listing matching. It searches only real approved marketplace listings and the existing direct smoked-catfish catalogue. It does not create orders, initiate payments, confirm stock or promise delivery. It does not invent suppliers, stock, prices or delivery coverage.

### Vendor portal

The vendor assistant answers questions using the authenticated vendor's own products and recent sales records, plus approved marketplace context where relevant. It can help prepare product listings and record sales, but it cannot save or publish them directly.

- Product listings are collected one missing detail at a time. The farmer reviews the draft and explicitly confirms submission. The existing backend creates a `pending` listing for admin review.
- Sales are collected one missing detail at a time. The farmer reviews and explicitly confirms saving. Existing backend validation remains authoritative for totals, amounts and payment rules. Sales remain farmer-reported and unverified unless independently verified by Elevoni.
- The model must not invent product, price, quantity, stock, buyer, date, payment or delivery details.

## Selected language behaviour

The supported selections are Nigerian English (`en-NG`), Nigerian Pidgin (`pcm-NG`), Hausa (`ha-NG`), Igbo (`ig-NG`) and Yoruba (`yo-NG`). The selected language is passed to the model instructions and transcription route. Customer-facing navigation labels and assistant messages are localized before being returned. Vendor responses receive a language-conformance pass for non-English selections.

Language instructions are not proof of native-level accuracy. In particular, Pidgin transcription currently uses English as the transcription language hint with an explicit Nigerian Pidgin prompt. Test real recordings and model responses with native speakers before making a public accuracy claim.

## Voice architecture

1. The browser records a short audio clip using MediaRecorder.
2. The clip is sent to the Elevoni backend.
3. The backend calls OpenAI GPT-Transcribe with the selected language hint and a language-specific prompt.
4. The transcript is shown in the composer for the user to review before sending.
5. The final assistant response is sent to ElevenLabs for speech generation using the voice ID configured for the selected language.
6. If that language's ElevenLabs voice ID is missing or the provider rejects it, the text remains available and the UI should show a clear voice-unavailable message. Never silently substitute a voice from another language.

ElevenLabs environment variables are server-side only:

```env
ELEVENLABS_API_KEY=<server-side API key>
ELEVENLABS_TTS_MODEL=eleven_v3
ELEVENLABS_ENGLISH_VOICE_ID=<voice ID>
ELEVENLABS_PIDGIN_VOICE_ID=<voice ID>
ELEVENLABS_HAUSA_VOICE_ID=<voice ID>
ELEVENLABS_IGBO_VOICE_ID=<voice ID>
ELEVENLABS_YORUBA_VOICE_ID=<voice ID>
```

The voice IDs must be selected and tested in Elevoni's ElevenLabs account. Do not invent voice IDs or claim local-language pronunciation quality without native-speaker validation. Confirm the account plan, voice rights and commercial-use permissions before production use.

## Backend environment

Configure these in the backend hosting environment, not in either frontend:

```env
OPENAI_API_KEY=<OpenAI project API key>
OPENAI_MODEL=gpt-6.1-sol
OPENAI_REASONING_EFFORT=low
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
OPENAI_TIMEOUT_MS=45000
OPENAI_TRANSCRIPTION_TIMEOUT_MS=90000

ELEVENLABS_API_KEY=<ElevenLabs API key>
ELEVENLABS_TTS_MODEL=eleven_v3
ELEVENLABS_ENGLISH_VOICE_ID=<voice ID>
ELEVENLABS_PIDGIN_VOICE_ID=<voice ID>
ELEVENLABS_HAUSA_VOICE_ID=<voice ID>
ELEVENLABS_IGBO_VOICE_ID=<voice ID>
ELEVENLABS_YORUBA_VOICE_ID=<voice ID>

MONGO_URI=<existing production MongoDB connection string>
JWT_SECRET=<existing Elevoni JWT secret>
```

Keep `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` in backend environment variables only. Never prefix either key with `VITE_`, expose it to the browser, commit it, or place it in source code.

## Rate limits and cost controls

There is no fixed 1,000-user N-ATLaS gate on the live assistant routes. OpenAI project rate limits, account usage limits and billing apply. Elevoni still has short-window per-IP/per-vendor throttling to protect the service from abuse. Configure an OpenAI project budget/spend alert and monitor token usage, transcription minutes, error rates and latency. ElevenLabs usage and plan limits apply separately.

The former N-ATLaS usage dashboard is historical audit data only. It is not a live OpenAI usage or cost dashboard.

## Privacy and data handling

Text messages and relevant conversation history are sent to OpenAI for assistant processing. Voice recordings are sent to OpenAI for transcription. Assistant response text may be sent to ElevenLabs for audio generation. Vendor assistant requests include relevant records from that authenticated vendor's own Elevoni products and sales. The application does not intentionally save raw audio recordings or assistant conversation text as account records. Review OpenAI and ElevenLabs current data-processing, retention and commercial terms and ensure Elevoni's privacy policy matches the production configuration.

## Deployment and validation checklist

1. Create an OpenAI API project and key. Add billing/usage controls. Put the key in backend environment settings only.
2. Configure `OPENAI_MODEL=gpt-6.1-sol`, `OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe` and the timeouts shown above.
3. Configure ElevenLabs API access and the dedicated voice IDs for each language offered in production.
4. Deploy the backend before deploying the frontends. The current frontend uses `/api/assistant/customer/...`; the vendor portal uses `/api/assistant/vendor/...`.
5. Test customer and vendor text chat in English, Pidgin, Hausa, Igbo and Yoruba. Check that the selected language is respected and that the customer assistant searches only real approved listings.
6. Test voice transcription separately in all five languages. Include Nigerian accents, code-switching, background noise, product names, place names, numbers, dates and prices. Have native speakers review the transcripts.
7. Test ElevenLabs speech generation separately in all five languages. Verify each voice ID and pronunciation. A configured ID is not proof of good pronunciation.
8. Test vendor listing and sales flows end-to-end. Verify one question at a time, correct draft extraction, no invented fields, explicit confirmation before submission, pending admin review for listings, and farmer-reported/unverified status for sales.
9. Verify missing OpenAI keys, invalid credentials, rate limits, timeouts and missing ElevenLabs voice IDs produce clear errors without losing the readable text response.
10. Monitor OpenAI spend, model/token usage, transcription minutes, API rate limits, ElevenLabs character usage, latency and provider errors.

## Known limitations

- OpenAI language support does not guarantee equal recognition quality for Nigerian English, Pidgin, Hausa, Igbo and Yoruba. Native-speaker evaluation is required.
- Nigerian Pidgin currently uses an English transcription language hint and an explicit Pidgin prompt. Code-switching and local expressions may still be transcribed incorrectly.
- ElevenLabs playback requires a working dedicated voice ID and support for the target language in the selected TTS model. If a voice is unavailable, do not silently use another language's voice.
- Syntax checks and mocked tests do not replace production API calls, real audio tests or native-speaker evaluation.

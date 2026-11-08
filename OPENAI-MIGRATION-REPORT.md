# Elevoni OpenAI Migration — implementation report

Date: 8 November 2026

## Implemented in source

- Replaced N-ATLaS vendor assistant intelligence with OpenAI Responses API.
- Replaced N-ATLaS customer assistant interpretation/localization with OpenAI Responses API.
- Added strict JSON Schema output for vendor assistant responses and customer marketplace criteria.
- Set default model to `gpt-6.1-sol`, configurable with `OPENAI_MODEL`.
- Added OpenAI GPT-Transcribe integration for customer and vendor voice input, with selected-language hints and an explicit Nigerian Pidgin transcription prompt.
- Kept ElevenLabs as the only live text-to-speech provider. It requires the dedicated voice ID configured for the selected language; no cross-language voice substitution is allowed.
- Removed the N-ATLaS 1,000-user admission middleware from all live customer and vendor assistant chat, transcription and speech routes. Existing per-IP/per-vendor short-window throttling remains for abuse protection.
- Added provider-neutral routes under `/api/assistant/customer` and `/api/assistant/vendor`; retained the former `/api/n-atlas/...` routes as compatibility aliases.
- Removed the `n-atlas` npm dependency from `backend/package.json` and `backend/package-lock.json`.
- Removed the anonymous N-ATLaS visitor-ID header from the storefront assistant.
- Updated the backend environment example, privacy policy, implementation guide and admin navigation. The former N-ATLaS usage page is now explicitly historical.
- Replaced the customer/vendor assistant Awarri attribution with accurate provider attribution: AI by OpenAI, voice by ElevenLabs. Awarri is no longer shown as the live provider because the live assistant no longer calls N-ATLaS.

## Environment variables required

Set these in the backend hosting environment only:

```env
OPENAI_API_KEY=<secret OpenAI API key>
OPENAI_MODEL=gpt-6.1-sol
OPENAI_REASONING_EFFORT=low
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
OPENAI_TIMEOUT_MS=45000
OPENAI_TRANSCRIPTION_TIMEOUT_MS=90000

ELEVENLABS_API_KEY=<secret ElevenLabs API key>
ELEVENLABS_TTS_MODEL=eleven_v3
ELEVENLABS_ENGLISH_VOICE_ID=<voice ID>
ELEVENLABS_PIDGIN_VOICE_ID=<voice ID>
ELEVENLABS_HAUSA_VOICE_ID=<voice ID>
ELEVENLABS_IGBO_VOICE_ID=<voice ID>
ELEVENLABS_YORUBA_VOICE_ID=<voice ID>
```

Do not put provider keys in frontend `VITE_` variables or commit them. The repository does not contain API keys or voice IDs.

## Verification performed

- 42 targeted backend tests passed, including new OpenAI request/transcription tests, route-cap removal tests, listing/sales draft validation, provider error tests and ElevenLabs voice tests.
- `node --check` passed for changed backend modules and route/controller files.
- TypeScript JSX transpilation/parser checks passed for 8 changed frontend/vendor/admin React files.
- `n-atlas` is absent from backend package.json and package-lock.json.
- Full backend test suite was attempted but could not complete because `npm ci` timed out and left an incomplete `node_modules` directory. The resulting failures were missing installed packages (for example mongoose, express and cloudinary), not assertions against the new OpenAI code. Do not treat the full suite as passed.
- Full Vite production builds were not run.
- No live OpenAI API key was available in this workspace, so no live Responses API or transcription request was made.
- No live ElevenLabs audio test was made. Actual language accuracy and voice quality still require provider tests and native-speaker review.

## Important validation limits

- OpenAI GPT-Transcribe is the current recommended file-transcription model, but that does not guarantee high-quality Nigerian Pidgin, Hausa, Igbo or Yoruba transcription. Test real farmer recordings before announcing language support as production-ready.
- Nigerian Pidgin uses an English language hint plus a Pidgin-specific prompt. Code-switching may still cause recognition errors.
- ElevenLabs TTS works only where the API key and dedicated voice ID are valid and the selected TTS model supports the target language. The presence of a voice ID is not proof of natural pronunciation.
- OpenAI API usage has rate limits and billing controls. The old 1,000-user cap is removed, but this is not unlimited free usage. The backend still has short-window abuse throttles.
- ChatGPT subscription billing and API billing are separate.

## Deployment sequence

1. Add the OpenAI and ElevenLabs backend environment variables.
2. Deploy the backend first.
3. Test customer and vendor text requests in all five selected languages.
4. Test OpenAI transcription and ElevenLabs TTS independently in all five languages.
5. Test listing and sales drafts, one question at a time, with explicit confirmation before saving.
6. Test error paths: missing API key, invalid key, OpenAI 429, timeout, missing ElevenLabs voice ID and ElevenLabs provider failure.
7. Deploy the storefront and vendor portal after backend verification.
8. Monitor OpenAI API usage and ElevenLabs usage separately.

The focused patch is intended to be merged into the existing `C:\Users\User\Desktop\ELEVONI` project. It does not include `.env`, API credentials, `node_modules`, or production deployment configuration.

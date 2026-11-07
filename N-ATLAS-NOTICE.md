# Elevoni Assistant / N-ATLaS attribution and usage conditions

Elevoni Assistant is Elevoni's branded assistant experience powered by the N-ATLaS model service. The assistant displays **Elevoni Assistant — Elevoni assistant** and exposes the required technology attribution:

> N-ATLaS is an initiative of the Federal Ministry of Communications, Innovation and Digital Economy, and powered by Awarri Technologies.

> Awarri Technologies and the Federal Government of Nigeria, developers of N-ATLaS (Hausa-ASR / Igbo-ASR / Yoruba-ASR / NigerianAccentedEnglish).

## Elevoni's written Awarri condition

Elevoni has confirmed in writing with Awarri that the 1,000-user condition applies to **N-ATLaS users**, not every visitor to Elevoni. The implementation treats the condition strictly as fewer than 1,000 unique N-ATLaS users in a rolling 30-day period, admitting at most 999. Retain the original correspondence and use its exact wording if it defines users more specifically.

The Elevoni backend enforces the rolling limit through an atomic MongoDB usage ledger. Authenticated accounts are keyed by account ID; anonymous visitors are keyed by a first-party browser UUID that is HMAC-hashed before storage. Repeated N-ATLaS messages and language changes do not create additional users within the same active window. ElevenLabs ASR/TTS calls do not independently count as N-ATLaS usage. The backend admits at most 999 active unique N-ATLaS users. At 999, existing active users can continue but new users are blocked; at 1,000 or more, all N-ATLaS chat requests are blocked without refreshing timestamps. ElevenLabs transcription and voice generation are separate provider calls and do not independently consume the N-ATLaS allowance. The rest of Elevoni remains available. Existing-user access resumes when the rolling count falls below 1,000; new-user admission resumes when it falls below 999.

See `ELEVONI-ASSISTANT-IMPLEMENTATION.md` for deployment variables, dashboard details, identity limitations and testing steps.

## Text-to-speech checkpoint restriction

The supplied N-ATLaS Kit documentation identifies optional Soro-TTS/MMS-TTS checkpoints as CC BY-NC 4.0. The Awarri usage condition for N-ATLaS does not automatically override those separate checkpoint licences. The supplied Modal deployment keeps server-side TTS disabled. Elevoni Assistant uses ElevenLabs for cloud speech recognition and configured cloud voice generation. Browser/device speech fallback is disabled by default. Do not enable `NATLAS_ENABLE_TTS=true` without separate permission for the exact N-ATLaS voice checkpoints and their outputs.

## Attribution sources

- Model repository: https://huggingface.co/NCAIR1/N-ATLaS
- Toolkit: https://github.com/Kambah123/N-ATLAS-Kit
- Required attribution strings are reproduced from the supplied N-ATLaS Kit `NOTICE`.

## ElevenLabs voice processing

Elevoni Assistant sends voice recordings to ElevenLabs Scribe v2 for transcription and may send assistant response text to ElevenLabs for speech generation. This is a separate provider and is not covered by Awarri's N-ATLaS user allowance. ElevenLabs plan terms, voice rights, data processing and retention must be checked separately.

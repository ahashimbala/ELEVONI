# Elevoni Assistant / N-ATLaS attribution and usage conditions

Elevoni Assistant is Elevoni's branded assistant experience powered by the N-ATLaS model service. The assistant displays **Elevoni Assistant — Elevoni assistant** and exposes the required technology attribution:

> N-ATLaS is an initiative of the Federal Ministry of Communications, Innovation and Digital Economy, and powered by Awarri Technologies.

> Awarri Technologies and the Federal Government of Nigeria, developers of N-ATLaS (Hausa-ASR / Igbo-ASR / Yoruba-ASR / NigerianAccentedEnglish).

## Elevoni's written Awarri condition

Elevoni has confirmed in writing with Awarri that the 1,000-user condition applies to **N-ATLaS active end users**, not every visitor to Elevoni. The implementation permits no more than 1,000 unique users in an exact rolling 30-day window. Retain the original correspondence and use its exact wording if it defines users more specifically.

The Elevoni backend enforces the rolling limit through an atomic MongoDB usage ledger. Authenticated accounts are keyed by account ID; anonymous visitors are keyed by a first-party browser UUID that is HMAC-hashed before storage. Repeated N-ATLaS messages and language changes do not create additional users within the same active window. Hausa, Igbo and Yoruba ASR/TTS requests use N-ATLaS and count toward the same allowance; English and Pidgin retain their configured speech provider. The backend admits up to 1,000 active unique N-ATLaS users. At 1,000, existing active users can continue but new users are blocked; the 1,001st active identity is not admitted. N-ATLaS speech recognition and voice generation for Hausa, Igbo and Yoruba are counted in the same user allowance as N-ATLaS chat. The rest of Elevoni remains available. Existing-user access resumes when the rolling count falls below 1,000; new-user admission resumes when it falls below 1,000.

See `ELEVONI-ASSISTANT-IMPLEMENTATION.md` for deployment variables, dashboard details, identity limitations and testing steps.

## Speech provider configuration

Awarri has subsequently confirmed to Elevoni that Hausa, Igbo and Yoruba speech recognition and voice generation are available under the same no-more-than-1,000-active-end-users rolling 30-day condition. The current integration routes those three languages through the private N-ATLaS gateway for ASR and TTS and counts those requests in the same MongoDB user ledger as chat. The backend expects `/v1/audio/transcriptions` and `/v1/audio/speech` on the configured gateway origin. Keep the written Awarri confirmation with the licensing records and verify the production gateway exposes both endpoints before enabling voice features. English and Nigerian Pidgin retain the existing configured speech provider.

## Attribution sources

- Model repository: https://huggingface.co/NCAIR1/N-ATLaS
- Toolkit: https://github.com/Kambah123/N-ATLAS-Kit
- Required attribution strings are reproduced from the supplied N-ATLaS Kit `NOTICE`.

## Voice processing

Hausa, Igbo and Yoruba recordings and generated speech are processed through the authorized N-ATLaS gateway and count toward the same rolling 30-day active-user allowance as N-ATLaS chat. English and Nigerian Pidgin continue to use Elevoni's configured speech provider. The privacy notice must reflect the actual provider and applicable retention terms for each language.

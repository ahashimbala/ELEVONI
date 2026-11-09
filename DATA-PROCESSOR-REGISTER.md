# Elevoni data processor and third-party register

This register is a starting inventory derived from integrations visible in the supplied source archive. Confirm actual production use, account region, sub-processors, data categories, retention, transfer location and contract status with each provider.

| Provider / category | Feature / data potentially processed | Required action before production |
|---|---|---|
| Vercel | Website and API hosting, request metadata, deployment logs | Confirm DPA, region, subprocessors, log retention and access controls |
| MongoDB / hosting provider | Accounts, products, vendor profiles, orders, requirements and sales records | Confirm DPA, region, encryption, backups, least-privilege access and deletion |
| OpenAI | Assistant prompts/context and speech transcription when enabled | Confirm applicable business/API data terms, retention controls, DPA and international transfer safeguards |
| ElevenLabs | Text sent for generated speech; voice configuration | Confirm DPA, retention, subprocessor and transfer terms |
| Modal / Dynamic ASR | Audio transcription if `ASSISTANT_ASR_PROVIDER=dynamic-asr` | Confirm Modal terms, model licence, region, logs and whether audio is retained |
| Paystack | Payment details, transaction reference and payment status | Confirm merchant agreement, data roles, webhook security and dispute/refund workflow |
| Cloudinary | Product/vendor images and media | Confirm DPA, access controls, retention and region |
| Google | Google sign-in; Google Analytics only after consent | Confirm OAuth configuration, analytics consent settings, DPA and transfer terms |

## Required fields for the signed register
- Legal entity and account owner
- Service and processing purpose
- Personal-data categories
- Data-subject categories
- Processing location and international transfer basis
- Retention and deletion controls
- Security measures
- Subprocessor list
- DPA / contract URL and signed date
- Incident notification contact
- Exit and data export/deletion procedure

Do not mark a provider “DPA signed” until a responsible Elevoni officer has verified and retained the executed agreement.

# N-ATLaS implementation notes

## Included in this iteration
- N-ATLaS workspace in the Vendor Portal at `/n-atlas`, available through the existing approved-vendor route.
- Multilingual text chat for English, Nigerian Pidgin, Hausa, Igbo and Yoruba through the authenticated Elevoni backend adapter and the N-ATLaS Kit OpenAI-compatible gateway.
- Voice capture through browser `MediaRecorder`; recordings are sent to the authenticated backend transcription endpoint and forwarded to the matching NCAIR1 ASR model. Transcripts are placed in the composer for the user to review before sending.
- Language preference persisted in browser local storage.
- A guided listing-draft flow for the current livestock, poultry, aquaculture and fisheries categories. Drafts are reviewed by the vendor and carried into the existing dashboard listing form.
- Existing Elevoni vendor authentication, approval checks, listing routes and business rules remain authoritative.
- Explicit `NATLAS_DEMO_ENABLED=true` opt-in; the N-ATLaS backend routes are disabled by default.

## Important capability boundaries
- This iteration makes the **Vendor Portal N-ATLaS workspace** multilingual; it does not translate every page of the customer marketplace, admin application or the entire Vendor Portal interface.
- The integration calls a real N-ATLaS Kit gateway only when the private gateway URL/key are configured and the demo flag is enabled. No credentials are included in the repository.
- The gateway's server-side TTS route remains intentionally disabled while model permissions are unresolved. The “Listen” action uses browser/device speech synthesis and is not an N-ATLaS-generated voice. Availability and pronunciation depend on the device.
- Nigerian Pidgin has no dedicated ASR checkpoint in the supplied N-ATLaS Kit. Pidgin voice input currently uses the Nigerian English ASR model and may be inaccurate; typed Pidgin is sent with an English language hint and a Pidgin response instruction.
- Hausa, Igbo, Yoruba and Nigerian English ASR are wired to the corresponding NCAIR1 models, but no native-speaker accuracy benchmark has been completed with real farmer recordings.
- The assistant is read-only. It can return a listing draft but cannot publish listings, modify records or place orders. The vendor must review and continue through the existing dashboard flow.
- The workspace is for approved vendor accounts; it is not currently a customer-facing marketplace assistant.
- The current language dropdown selects the assistant response/transcription language; it does not automatically translate all marketplace content.

## Private COUCH demo
See [`N-ATLAS-COUCH-DEMO.md`](./N-ATLAS-COUCH-DEMO.md) for running the N-ATLaS Kit gateway in Modal development/serve mode and connecting a local Elevoni backend and Vendor Portal. The temporary Modal process must remain running for the demo. This is not a permanent deployment.

## Licensing and privacy
- N-ATLaS model and ASR weights have their own terms, separate from the SDK/repository code licence. Awarri's written clarification for Elevoni's intended use remains outstanding. Private technical integration does not grant commercial deployment rights.
- The Soro-TTS/MMS-TTS voices are not loaded by the standard gateway and are not used by this Elevoni integration.
- Voice recordings are held in backend memory for the request and forwarded to the private gateway; this code does not persist the uploaded audio as an Elevoni file. Do not record or submit personal/sensitive information unnecessarily.
- Keep `NATLAS_API_KEY` exclusively in the backend environment. Never use a `VITE_` prefix or place it in browser code.

## Verification status
- Backend changed files pass Node syntax checks.
- Full backend tests and Vendor Portal production build could not be completed in this environment because `npm ci` timed out and left incomplete `node_modules` directories. A subsequent `npm test` therefore failed on missing dependencies, not on demonstrated assertion failures.
- Live gateway chat/ASR, browser microphone capture, and device speech synthesis have not been exercised from this packaged codebase. Follow the private demo runbook on a machine with dependencies installed and authorized Modal access.

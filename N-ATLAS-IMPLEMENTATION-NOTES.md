# N-ATLAS implementation notes

## Included in this iteration
- N-ATLAS workspace in the Vendor Portal at `/n-atlas`.
- Minimal, responsive interface with a restrained futuristic visual language, conversation view, prompt cards, language selector, voice-input control, read-aloud control, and mobile layout.
- Language preference persisted in browser local storage for English, Nigerian Pidgin, Hausa, Igbo and Yoruba.
- Browser-native speech recognition and speech synthesis are used when available.
- A guided product-listing draft flow recognises a small set of common crop/livestock/fish names and quantities from typed or transcribed text.
- Draft details can be carried into the existing Vendor Dashboard listing form. The existing backend listing and vendor approval routes remain the authority.

## Important capability boundaries
This is a working frontend prototype, not a connected generative-AI assistant yet. Conversation responses and draft extraction are deterministic client-side logic. No AI provider credentials or speech-provider credentials were present in the supplied project, so no external model was called and no provider was invented.
Browser speech recognition support and language quality vary by browser/device. In particular, Nigerian Pidgin, Hausa, Igbo and Yoruba recognition/synthesis must be validated with real recordings and chosen providers before claiming reliable production support.
The draft is not submitted or published by N-ATLAS. The farmer must continue to the existing dashboard listing form and use its established save/review flow. Product/vendor approval requirements remain unchanged.

## Verification
The archive structure was normalised from Windows-style ZIP path separators. A dependency install/build could not be completed in this environment, so a Vite production build and browser/device speech tests remain outstanding. Run `npm ci` and `npm run build` inside `vendor-portal` before merging/deploying.

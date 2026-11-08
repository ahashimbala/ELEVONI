# Elevoni Assistant — product selection, mobile navigation, language and voice update

## Changes made

### Vendor sales entry
- Added an explicit `No, it is not listed — enter product manually` choice inside the listed-product dropdown.
- Selecting it switches the sales form to the existing unlisted-product entry path and clears the selected listing ID.
- The existing Yes/No radio controls remain available.

### Vendor mobile navigation
- Re-aligned the fixed bottom navigation to the customer storefront's 62px minimum bar height, 7px padding and safe-area handling.
- Replaced text-symbol glyphs with consistent home, microphone/assistant and account icon artwork; sales and application also have matching icon treatment.

### Awarri attribution
- Kept the vendor portal's shared-layout attribution.
- Added `N-ATLaS voice technology powered by Awarri Technologies` directly below the customer assistant composer as well as the shared storefront footer.

### Language enforcement
- Vendor assistant now runs a second language-conformance pass on its final user-facing reply for Hausa, Igbo, Yoruba and Nigerian Pidgin. Structured draft fields remain unchanged.
- Customer assistant no longer silently returns an English fallback when localization fails for a non-English selection; it returns an explicit service error instead.
- Both assistants retain the selected language in their API requests and start a fresh conversation when the language changes.
- Language quality still depends on N-ATLaS model capability and must be checked with native speakers; the application cannot mathematically guarantee perfect translation or dialect fidelity.

### Voice playback
- Hausa, Igbo and Yoruba try the authorized N-ATLaS `/v1/audio/speech` gateway first. If it fails, the backend can use ElevenLabs only when a dedicated voice ID for that exact language is configured.
- English and Nigerian Pidgin use their own ElevenLabs voice IDs. Pidgin no longer silently borrows the English voice ID.
- Browser fallback is allowed only when the device reports a matching language voice. It will not silently use a different-language default voice.
- Added optional environment variables for dedicated Hausa, Igbo and Yoruba voice IDs.

## Voice implementation reality / deployment requirements

The repository contains server-side TTS integration code, but that is not proof that Awarri has provisioned working Hausa, Igbo and Yoruba voices on the live gateway. The gateway must return valid audio for each requested language. If it does not, the corresponding dedicated ElevenLabs voice ID must be configured in the backend environment. English and Pidgin also need their respective dedicated voice IDs. Do not advertise all five voices as live until each one has passed an actual audio playback test with native speakers.

New optional backend environment values:
- `ELEVENLABS_HAUSA_VOICE_ID`
- `ELEVENLABS_IGBO_VOICE_ID`
- `ELEVENLABS_YORUBA_VOICE_ID`

Existing values still required for direct ElevenLabs speech:
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_ENGLISH_VOICE_ID`
- `ELEVENLABS_PIDGIN_VOICE_ID`

No API keys or private credentials are included in this patch.

## Verification
- 17 targeted backend tests passed, including the regression test that prevents Pidgin from borrowing an English voice.
- Backend changed JavaScript files passed `node --check`.
- Four changed React JSX files passed TypeScript JSX transpilation/parser checks.
- Full Vite production builds, live Awarri gateway speech tests, ElevenLabs account tests, and device-level audio playback tests were not run in this environment.

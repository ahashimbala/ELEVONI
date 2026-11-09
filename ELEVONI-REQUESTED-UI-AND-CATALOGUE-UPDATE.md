# Elevoni — requested navigation, buying requirement and assistant update

## Changes

- Removed Account from the vendor portal's mobile bottom navigation and placed an Account / Sign in link in the top header for desktop and mobile.
- Reduced the mobile vendor navigation to six items: Home, Sales, Matches, Insights, Assistant and Apply.
- Changed the buying-requirement submit button to the shared Elevoni sage token (`--elevoni-sage`, `#7c8760`).
- Simplified the buying-requirement form by removing Business name, Delivery area, When do you need it, Maximum price per unit, Preferred condition and Other requirements as separate visible fields. The buyer can still describe their requirement in the language text box; the interpreter can preserve optional constraints found in that description for matching.
- Added a shared microphone permission helper to the customer assistant, Tinka and vendor assistant. It checks for an already-denied permission before asking for microphone access, and provides guidance to choose a persistent Allow option if the browser offers one.
- Updated customer assistant product availability searches to check both Elevoni Direct catalogue products and approved Marketplace listings. Returned cards carry a source label, use the correct Direct or Marketplace enquiry destination, and do not present Direct products as independent vendor listings.

## Microphone permission limitation

A web app cannot programmatically select “Always allow” or “Allow while using this app” in the operating system or browser permission dialog. The user must choose that option. Browsers that remember a persistent grant will normally not prompt again; an “Allow once” choice may be requested again later by design. The app does not keep the microphone stream open after each recording just to suppress future prompts, because that would leave microphone access active unnecessarily.

## Verification

- `node --check` passed for the modified backend JavaScript and microphone helper modules.
- TypeScript JSX parser checks passed for the modified React JSX files.
- 23 targeted backend tests passed: customer criteria, cart actions and buyer-requirement intelligence.
- The full backend suite was attempted, but 15 tests could not start because this extracted source workspace has no installed backend dependencies (for example `mongoose`, `express`, `cloudinary` and `jsonwebtoken`). 121 other tests passed in that run.
- Frontend and vendor production builds were not run because dependency installation did not complete in this environment.
- No live database, OpenAI, microphone hardware, mobile OS permission dialog or deployed environment test was performed.

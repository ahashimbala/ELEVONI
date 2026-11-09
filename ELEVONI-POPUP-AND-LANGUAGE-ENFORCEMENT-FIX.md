# Elevoni popup and selected-language enforcement fix

Date: 9 November 2026

## Changes

### Login/signup popup positioning
- Rendered the login/signup dialog through a React portal attached to `document.body`, so fixed positioning is not affected by transformed or overflow-clipped application ancestors.
- Lock the background page while the popup is open while preserving the exact scroll offset.
- Restore the previous body styles and scroll position when the popup closes.
- Added dialog semantics (`role=dialog`, `aria-modal`, and a labelled heading).

### Customer assistant language enforcement
- Strengthened the selected-language instruction so every assistant reply, clarification, confirmation and navigation label must use the selected language.
- Tightened the localization pass to disallow ordinary English sentences in non-English responses.
- Replaced English customer chat error bubbles with selected-language messages for Nigerian English, Pidgin, Hausa, Igbo and Yoruba.

### Vendor assistant language enforcement
- Strengthened the vendor assistant's final response-conformance instruction to require every ordinary sentence in the selected language.
- Replaced English error bubbles with selected-language messages.
- Localized the assistant's product-listing, sales-save and duplicate-submission confirmations for all five supported languages.

## Validation
- `node --check` passed for both changed backend service files.
- TypeScript JSX transpilation/parser checks passed for the three changed React files.
- Full Vite builds, backend integration tests, live OpenAI response tests, and browser/device popup tests were not run in this environment because project dependencies and live credentials are not available here.
- Source changes are prepared; nothing has been deployed.

## Important note
The popup fix applies to the storefront login/signup modal (`LoginPopup`). The customer Elevoni Assistant remains a dedicated `/assistant` page in this source; it has not been converted into a floating chat popup.

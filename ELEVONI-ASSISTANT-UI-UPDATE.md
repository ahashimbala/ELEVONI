# Elevoni Assistant UI and attribution update

## Customer storefront
- Restored the shared storefront Navbar on the Assistant route, including the existing Elevoni logo, navigation, sign-in/profile controls and current theme.
- Restored the standard storefront Footer on the Assistant route in browser sessions.
- Removed the duplicate letter-mark Assistant header and reduced welcome, conversation and usage copy.
- Matched Assistant controls to the existing storefront sage palette and button styling.
- Added a visible footer credit: “N-ATLaS powered by Awarri Technologies”.

## Vendor portal
- Removed the Assistant's duplicate sidebar because VendorLayout already provides the Elevoni logo and navigation.
- Simplified the Assistant heading and suggested actions; moved New chat next to language selection.
- Matched buttons and controls to the vendor portal's sage palette.
- Added a visible footer credit: “N-ATLaS voice technology powered by Awarri Technologies”.
- Kept the footer visible on mobile and added bottom clearance for the fixed mobile navigation.
- Shortened the composer helper text while retaining the important reminder that sales records are farmer-reported until independently verified.

## Validation
- JSX/TSX parser checks passed for the five changed React components.
- `node --check` passed for the previously updated N-ATLaS usage middleware/service files.
- Full Vite production builds and browser/device visual checks were not run because dependencies could not be installed in this environment (`npm ci` timed out).
- No backend business logic, N-ATLaS usage limits, sales APIs, product APIs or environment configuration were changed in this UI update.

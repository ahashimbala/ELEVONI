# Elevoni — cross-language product matching and vendor account UI update

## Changes

### Product matching across languages
- Customer assistant instructions now explicitly normalize Hausa, Igbo, Yoruba and Nigerian Pidgin product references to canonical English product concepts where clear.
- Added a structured cross-language matching pass that compares the buyer's query with approved Marketplace product names, descriptions, categories, subcategories, species and condition.
- The matcher is constrained to IDs from the approved candidate set; it cannot invent a product or vendor listing.
- Marketplace search now combines ordinary lexical results with cross-language matches, while retaining the existing approval, availability, vendor, location, price and stock safeguards.
- Elevoni Direct product lookup and cart selection also have a cross-language fallback. Marketplace listings remain enquiry-only and are not added to the Direct checkout cart.
- Candidate scan is bounded to the 250 most recently updated products matching the other approved-vendor and structured filters. This is suitable for the current bounded catalogue but is not an unlimited full-database semantic index. Native-speaker test coverage is still required for Hausa, Igbo, Yoruba and Pidgin product names and spelling variants.

### Vendor portal account control
- Replaced the rectangular Account icon/link with the customer storefront's circular sage avatar treatment.
- The avatar displays the first character of the vendor's name (or email if no name is available).
- Clicking the avatar opens an Account / Sign out dropdown. The unauthenticated state retains a Sign in control.
- The header control is responsive and remains in the top navigation on mobile and desktop.

## Files changed
- `backend/services/nAtlasCustomer.js`
- `vendor-portal/src/components/Layout/VendorLayout.jsx`
- `vendor-portal/src/components/Layout/VendorLayout.css`

## Verification
- `node --check backend/services/nAtlasCustomer.js` passed.
- TypeScript JSX transpile/parser check passed for `VendorLayout.jsx`.
- Targeted customer matching and cart tests: 20 passed.
- Full backend/vendor production builds and live OpenAI/provider calls were not run because project dependencies are not installed in this working environment.
- No production deployment or live native-speaker validation was performed.

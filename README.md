# Elevoni Intelligent Matching Reliability Patch

This patch replaces the customer-facing buyer-to-product matching implementation and fixes the missing `rankProductsForBuyer` export from the earlier patch.

## Files to replace

- `backend/services/buyerRequirements.js`
- `backend/controllers/buyerRequirementsController.js`
- `backend/tests/buyer-requirements.test.js`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.jsx`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.css`

Keep the folder paths exactly as shown.

## Matching behaviour

- Reads the current catalogue from MongoDB, limited to approved, enabled listings that are not marked out of stock and have positive recorded stock or are explicitly marked Pre-order.
- Product identity is the relevance gate. Category, subcategory, location, quantity, unit, condition and price contribute to ranking and explanation; they are not strict exclusion filters.
- Uses product-name aliases such as maize/corn, chicken/poultry, cattle/cow, sheep/ram and common singular/plural forms.
- Returns up to 12 relevant listings ranked by fit.
- Shows partial quantity matches and mismatches clearly rather than silently hiding them.
- Identifies `vendorId: null` listings as Elevoni Farms direct products and populated vendor listings by the vendor business name.
- Displays the match cards and data-based explanations after the buyer submits the requirement.
- Keeps the vendor dashboard matching function (`rankRequirementsForVendor`) in the same service.

## Important accuracy rules

A listing shown here is a catalogue match, not a stock reservation, confirmed delivery, confirmed final price or completed order. Recorded inventory may be stale and must be confirmed with the seller before a buyer commits. Pre-order listings are labelled for confirmation.

The explanation is generated from the listing's recorded fields and matching rules. It does not claim that an AI model independently verified inventory.

## Validation performed

- `node --test backend/tests/buyer-requirements.test.js`: 9 tests passed.
- `node --check` passed for the modified backend service and controller.
- TypeScript JSX transpilation syntax check passed for `BuyerRequirementForm.jsx`.
- Full frontend production build and live MongoDB/API integration test were not run in this environment (frontend dependencies are not installed).

After replacing the files, run the backend tests and frontend build in the project environment before deploying.

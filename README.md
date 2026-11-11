# Elevoni customer-facing intelligent matching patch — corrected

This patch covers the buyer-to-product matching change and the follow-up requirement that Elevoni Farms' own house products are identified separately from independent marketplace vendors.

## Files included

- `backend/controllers/buyerRequirementsController.js`
- `backend/services/buyerRequirements.js` **(required matching export; this file was missing from the earlier patch)**
- `backend/services/buyerRequirementIntelligence.js`
- `backend/tests/buyer-requirements.test.js`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.jsx`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.css`

## Installation

From the root of the Elevoni repository, replace the files at the exact matching paths shown above. Keep the folder structure in this ZIP. Commit all six files together and redeploy the backend and frontend.

## Behaviour

- Buyer requirements continue to be stored and matched against eligible vendor listings for the vendor dashboard.
- The customer-facing response also ranks approved, available products by product, category/type, delivery state, unit and recorded stock sufficiency; an optional maximum price is respected.
- Matches are returned to the customer-facing form for display with an AI explanation (with a factual fallback if AI explanation is unavailable).
- Products with `vendorId: null` are treated as Elevoni Farms house products and use `originLocation` for location matching. The customer-facing response labels these as `Elevoni Farms` / `elevoni_direct`.
- Marketplace vendor listings retain their vendor business name and `marketplace_vendor` label.

## Important

This is a source patch, not a full project. Run the focused buyer-requirement tests and your normal backend/frontend builds before production deployment. A match is a potential match, not an order or a guarantee of stock; confirm stock, price and fulfilment with the seller.

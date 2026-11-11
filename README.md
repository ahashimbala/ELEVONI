# Elevoni Customer-Facing Intelligent Matching — Patch

This patch covers BOTH requested changes:

1. **Customer-facing buyer-to-product matching:** when a buyer submits a requirement, Elevoni finds suitable approved and available listings by product/category, delivery location, requested quantity and unit (and optional maximum price where supplied). Matching products are displayed on the main Marketplace page, with an AI-generated explanation of why each match fits. A factual fallback explanation is used if AI explanation is unavailable.
2. **Keep the farmer-side workflow:** buyer requirements continue to be saved and made available through the existing farmer-dashboard matching flow. This patch does not remove that behaviour.
3. **Include Elevoni Farms direct products:** products with `vendorId: null` are eligible under the same approval, availability, stock, product and location checks. The customer-facing result identifies these as **Elevoni Farms** (`sellerType: "elevoni_direct"`); vendor listings remain identified as marketplace suppliers.

## Files to replace
Copy these files into the matching paths in the project:

- `backend/controllers/buyerRequirementsController.js`
- `backend/services/buyerRequirementIntelligence.js`
- `backend/tests/buyer-requirements.test.js`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.jsx`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.css`

The existing `backend/services/buyerRequirements.js` matching logic is unchanged from the supplied project, so it is not included in this patch.

## Important behaviour and limits

- Only approved, available listings with sufficient recorded stock are returned.
- Requested quantity and listing unit must be compatible; product/category and delivery state must match.
- Location is taken from the approved vendor profile or the product's `originLocation` (including Elevoni direct products).
- Elevoni direct products are not treated as vendor listings; `vendorId: null` is the existing house-product convention.
- The existing farmer-dashboard requirement flow is retained.
- This is a code patch, not a claim that the complete application has been integration-tested or deployed.

## Apply and test

Replace the files at the paths above, then run the project's backend tests and frontend build in the project environment. The patch was syntax-checked, but a full integration test and frontend build have not been completed here.

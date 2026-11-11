# Elevoni buyer requirement retrieval update

## What changed
- Buyer form no longer asks for category or product type. Product name and delivery state are required; quantity, unit and LGA/town are optional. If quantity is entered, a unit is required.
- Buyer requirement interpretation now asks only for the product and delivery state as mandatory details.
- The buyer-requirement retrieval reuses the same cross-language OpenAI product-identity matcher used by Elevoni Assistant (`matchProductsAcrossLanguages`).
- Retrieval follows the Assistant pattern: broad approved Marketplace candidate pool + lexical name/description retrieval + AI cross-language identity matching, merged by product ID.
- Elevoni Direct catalogue products are queried separately and passed through the same AI identity matcher, then merged with direct lexical hits.
- Seller location, stock, unit and budget are explained/ranked after product identity retrieval. A location mismatch or partial stock does not silently erase a relevant product.
- Only approved, available Marketplace listings belonging to approved vendor profiles are considered. Elevoni Direct uses visible house catalogue entries (`vendorId: null`).
- The submission response now includes up to 12 matching products and the form displays them.
- Existing vendor dashboard matching endpoint and legacy fields remain compatible.

## Files
- `backend/services/nAtlasCustomer.js` (exports Assistant's existing AI matcher)
- `backend/services/buyerRequirements.js`
- `backend/services/buyerRequirementIntelligence.js`
- `backend/controllers/buyerRequirementsController.js`
- `backend/models/buyerRequirementModel.js`
- `backend/tests/buyer-requirements.test.js`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.jsx`

## Deployment
Replace files at the same paths and deploy backend and frontend together. Existing MongoDB documents remain compatible; new requirements save empty category/subcategory and nullable quantity/unit when not supplied. Ensure backend `OPENAI_API_KEY` is configured.

## Important validation limits
JavaScript syntax checks were run for modified backend files. This environment did not have the project's installed dependencies or access to the live MongoDB/OpenAI deployment, so no live integration test or production build is claimed. Run `npm test` in the backend and a production frontend build before deploying. After deployment, test a known approved Marketplace listing, an Elevoni Direct item, a different-language product name, a different-state seller and a partial-stock case.

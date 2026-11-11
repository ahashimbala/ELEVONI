# Elevoni Simplified AI Buyer Product Retrieval Patch

## Purpose

This patch replaces the buyer requirement form's category/subcategory-led workflow with a simpler product-name-first request and a real catalogue retrieval + AI ranking flow.

## Files to replace/add

Replace these files at the same paths in the Elevoni project:

- `backend/services/buyerRequirements.js`
- `backend/controllers/buyerRequirementsController.js`
- `backend/models/buyerRequirementModel.js`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.jsx`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.css`

Add these new files:

- `backend/services/buyerProductRetrieval.js`
- `backend/tests/buyer-product-retrieval.test.js`

Also replace the existing test file:

- `backend/tests/buyer-requirements.test.js`

## New buyer experience

The form asks for:

- Buyer name and phone/WhatsApp (required)
- Product name (required)
- Quantity and unit (optional)
- Delivery state and LGA/town (optional)
- Additional details (optional)
- Contact-sharing consent (optional)

Buyers no longer have to select a category or product type. The existing language selector remains.

## Retrieval and ranking design

1. The backend searches approved listings where `isAvailable: true` and availability is not `Out of stock`.
2. It searches product name, description, species, subcategory and category using the buyer's product words and a small set of common agricultural synonyms.
3. It also scans a recent catalogue window, merges duplicate records and creates a candidate pool of up to 100 listings. The retrieval query does not filter by category, subcategory, vendor ownership, delivery state or requested quantity.
4. The OpenAI model (`OPENAI_MODEL`, or `gpt-4o-mini` by default) ranks the real candidate records. It is instructed to keep relevant partial matches and explain differences instead of requiring every preference to match.
5. Returned IDs are checked against the database candidate IDs. AI cannot create a product or change its price, stock, unit, seller or location.
6. The backend builds factual stock/location/seller fields from the database. `vendorId: null` is labelled `Elevoni Farms` / `elevoni_direct`; populated vendor products are labelled marketplace suppliers.
7. Up to 12 matches are returned immediately with the saved buyer requirement. The same requirement is still available to vendor dashboards; vendor-side matching now allows relevant product-name matches without requiring category or location fields.

## Stock honesty

- A positive recorded quantity is shown as recorded stock.
- If recorded stock is lower than the requested quantity, the product can still appear as a partial match.
- A recorded zero is shown as zero, not hidden as unknown.
- Pre-order and seasonal listings are identified as not confirmed ready stock.
- Unknown stock is never presented as sufficient.
- Matching is not a confirmed order or a guarantee that the supplier still has the stock.

## Backend configuration

Set `OPENAI_API_KEY` in the backend deployment environment. `OPENAI_MODEL` may optionally select the model; default is `gpt-4o-mini`.

If OpenAI is unavailable, the backend falls back to basic product-name/description matching and returns a warning to the buyer. The UI should not imply that AI ranking ran in that case.

## Validation performed

- 12 focused backend tests passed using a mocked OpenAI response and mocked catalogue model.
- Backend syntax checks passed for changed JavaScript files.
- Frontend JSX transpilation check passed.
- No live MongoDB query, live OpenAI request, full backend suite, or production frontend build was run in this environment. Test the patch in staging against actual approved catalogue records before production deployment.

## Deployment

Apply the files at their exact relative paths, deploy backend and frontend together, and confirm the backend environment has `OPENAI_API_KEY`. Test with a known product whose approved listing is present in the database, including an Elevoni Direct product and an independent vendor product.

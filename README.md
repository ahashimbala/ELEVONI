# Elevoni Buyer Form Layout + Assistant-Style Listings Patch

## Files to replace

Copy these files into the same paths in the Elevoni project:

- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.jsx`
- `frontend/src/components/BuyerRequirementForm/BuyerRequirementForm.css`

## Changes

1. Keeps the required inputs first: buyer name, phone/WhatsApp, product name and delivery state.
2. Groups optional inputs at the end: quantity, unit, LGA/town and additional details.
3. Restores the unit selector using the existing shared `PRODUCT_UNITS` list (kg, gram, piece, crate, ton, bag, carton, litre, service and hour).
4. Keeps quantity and unit optional and sends blank values as null/empty string.
5. Displays returned product matches using the same visual structure and information hierarchy as Elevoni Assistant listing cards: product image/fallback, source badge (Elevoni Direct or Marketplace listing), price/unit, seller, location, availability, match reasons/stock note, product page link and enquiry link.
6. Uses the returned match source/seller fields to distinguish Elevoni Direct from approved Marketplace vendors.

## Notes

- This is a frontend-only patch. It does not change buyer retrieval, ranking, database queries or the backend response contract.
- It expects the existing buyer-requirement API to return `data.matches` with the fields produced by the current retrieval implementation (`id`, `name`, `source` or `sellerType`, `image`, `price`, `unit`, `sellerName`, `state`, `lga`, `availability`, `reasons` and `stockStatus`).
- The listing cards reuse the same CSS class names and presentation conventions as `ElevoniAssistant.jsx`, scoped by styles included in the buyer form stylesheet.
- The direct enquiry link follows the current Assistant behaviour and uses the existing Elevoni smoked-catfish WhatsApp contact constant for Elevoni Direct listings.

## Validation

- Buyer form JSX was transpiled with the installed TypeScript JSX parser without syntax diagnostics.
- No live browser interaction or production build was run in this environment.

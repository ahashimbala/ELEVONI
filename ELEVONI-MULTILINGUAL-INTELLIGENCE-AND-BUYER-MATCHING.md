# Elevoni multilingual intelligence and buyer matching update

## Scope

This update extends the current Elevoni source project with:

- Customer assistant cart actions for Elevoni Direct products, while Marketplace vendor products remain enquiry-only.
- A buyer-requirement intake form on the customer Marketplace page, with English, Nigerian Pidgin, Hausa, Igbo and Yoruba labels.
- Buyer-demand persistence and matching against approved, available vendor listings.
- A vendor Buyer Matches page with consent-aware buyer contact visibility.
- Vendor Sales Intelligence aggregates and a five-language insights dashboard.
- Multilingual vendor assistant instructions for sales recording, including natural phrasing, code-switching, number/date/quantity interpretation and canonical product matching.
- A sales-log shortcut that lets farmers choose the assistant language and record sales by text or voice.
- Dynamic ASR 1B Modal integration, selectable through backend environment variables.

## Buyer requirement workflow

1. Buyer can describe the requirement in any supported language in the Marketplace form. `POST /api/buyer-requirements/interpret` extracts a draft using OpenAI structured output; the buyer reviews and edits it.
2. Buyer submits a requirement from `/marketplace`. `POST /api/buyer-requirements` validates and stores the request in `BuyerRequirement`.
3. The request records canonical category/subcategory, quantity/unit, delivery state/LGA, optional needed-by date, optional maximum unit price, specifications, language and buyer contact consent.
4. Approved vendors call `GET /api/buyer-requirements/matches/vendor`.
5. Matching compares the buyer requirement with that vendor's own approved, available listings. It ranks category, subcategory, location, recorded stock and budget fit.
6. Known insufficient stock and unit mismatches are excluded. Unknown stock is surfaced as requiring confirmation, never treated as sufficient.
7. Buyer name/contact are withheld unless the buyer explicitly consents to sharing contact details with a suitable supplier.

A match is a lead/suggestion, not a confirmed order, stock reservation, payment or completed sale. The match endpoint does not update a buyer requirement to fulfilled or mark a transaction completed.

## Buyer requirement API

- `POST /api/buyer-requirements/interpret` — public/optional-auth multilingual extraction; returns an editable draft and never saves it. This endpoint has a simple in-memory per-IP throttle (5 requests per 10 minutes).
- `POST /api/buyer-requirements` — public/optional-auth request creation; five supported language codes accepted.
- `GET /api/buyer-requirements/matches/vendor` — authenticated approved-vendor endpoint; returns matches against the vendor's own approved listings.

The public creation endpoint applies a simple in-memory per-IP submission throttle. Production deployments with multiple serverless instances should add a shared rate-limit store or edge protection.

## Farmer Sales Intelligence

`GET /api/vendor/sales/insights?period=30d|90d|365d|all` aggregates the authenticated vendor's sales records. The response distinguishes:

- `recordedValue`: total value of saved sales records; not verified revenue.
- `amountReceived`: amounts recorded as received.
- `outstandingBalance`: recorded value less amounts received.
- `verifiedValue`: only records explicitly marked verified.
- `unverifiedValue`: records not marked verified.
- Top products, monthly activity, payment status and aggregate repeat-buyer counts.

Buyer contact details are not included in insights. Quantities are grouped by product and unit; they are not summed across incompatible units.

The vendor assistant now receives 30-day, 90-day and all-time aggregate context when the aggregation service is available. The recent detailed sales context remains limited to the most recent records. If aggregation fails, the assistant can still answer using the existing recent-record context and should not claim period totals it cannot see.

## Five-language support

The application language codes are:

- `en-NG` — Nigerian English
- `pcm-NG` — Nigerian Pidgin
- `ha-NG` — Hausa
- `ig-NG` — Igbo
- `yo-NG` — Yoruba

The vendor assistant uses the selected language for text/voice conversations, listing drafts, sales-record collection and sales-insight responses. Structured enums, categories, units, dates and amounts are normalized to canonical backend values before saving. Farmers must review and explicitly confirm sales drafts. Saved sales remain farmer-reported and unverified unless separately verified.

The Buyer Requirement form and vendor insights/matches pages have localized interface labels. The existing full manual Sales Log form has not been fully translated; the language selector on that page selects the language for the conversational text/voice workflow in Elevoni Assistant. Do not describe the entire vendor portal UI as fully translated.

Language quality is not yet certified as equal across the five languages. Automated tests validate structured contracts and safeguards, not native-speaker comprehension. Before production claims, run native-speaker tests for each language, including code-switching, number words, dates, product names, units, corrections and ambiguous requests.

## Dynamic ASR 1B

The Modal service is in `modal-asr/`. It uses the Dynamic ASR `real` 1B checkpoint on an A10 GPU. Configure the Modal secret `elevoni-asr-secret` with `ELEVONI_ASR_API_KEY`, deploy with `modal deploy modal_app.py`, then configure the backend:

```env
ASSISTANT_ASR_PROVIDER=dynamic-asr
DYNAMIC_ASR_MODAL_URL=https://YOUR-MODAL-ENDPOINT.modal.run
DYNAMIC_ASR_MODAL_API_KEY=YOUR_SAME_RANDOM_SECRET
DYNAMIC_ASR_TIMEOUT_MS=150000
```

Keep the key private. Never put it in frontend variables or source control. If Modal is not deployed/configured, leave `ASSISTANT_ASR_PROVIDER=openai` until it is ready. The code is prepared for the provider; this source package does not prove that the user's Modal app or Vercel environment has been deployed.

The model weights are CC BY-SA 4.0 and inference code is Apache-2.0. Review the model licence and any commercial obligations before production use.

## Verification performed for this update

- Targeted backend tests: buyer requirement validation/matching, customer cart actions, Dynamic ASR client, sales draft validation and sales insights period parsing.
- JSX transpile/parser checks for changed customer/vendor React pages.
- Node syntax checks for changed backend services, controllers, routes and server.

Not performed in this environment:

- Full backend or frontend/vendor production builds (project dependencies were not installed in this working copy).
- Live MongoDB integration, live OpenAI calls, native-speaker language evaluation, live Modal inference, or Vercel deployment.

## Important next production checks

1. Install dependencies and run the full test suite/build for backend, frontend and vendor portal.
2. Confirm MongoDB can create the new `BuyerRequirement` indexes.
3. Submit a test requirement and verify an approved vendor with a matching listing sees it.
4. Verify unknown stock is labelled for confirmation, insufficient stock and unit mismatch do not match, and contact remains hidden without consent.
5. Exercise sales insight date ranges and reconcile totals against known test records.
6. Run native-speaker test scripts in all five languages before claiming parity.
7. Deploy Modal and configure Vercel environment variables only when ready; test real inference separately from code-level checks.

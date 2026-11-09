# Multilingual acceptance test plan

This is a test plan, not evidence that native-speaker evaluation has already passed.

Run the same task set in `en-NG`, `pcm-NG`, `ha-NG`, `ig-NG` and `yo-NG`. For Hausa, Igbo and Yoruba, use native speakers to write natural local-language prompts rather than relying on machine-translated English. Include regional vocabulary, common code-switching and noisy farmer voice recordings.

## Customer assistant

- Find a named product by category and subcategory.
- Search with a quantity, unit and location.
- Search with a per-unit budget; separately test ambiguous total budgets.
- Request an unavailable product and submit a buyer requirement.
- Ask for an Elevoni Direct product and distinguish it from an independent Marketplace listing.
- Set, increase, decrease and remove a Direct-cart item; clear and view the cart; navigate to checkout.
- Use ambiguous product names and confirm the assistant asks instead of guessing.

## Buyer requirement interpretation

- Product name and category/subcategory extraction.
- Quantity words, decimals and units.
- State, LGA and delivery-area extraction.
- Needed-by dates and ambiguous dates.
- Per-unit budget versus total budget.
- Product names with local-language terms and common English code-switching.
- Missing details produce one clarification; no missing value is silently invented.
- Buyer reviews and edits the draft before submitting.

## Farmer sales logging

- Record an offline phone, WhatsApp and in-person sale.
- Extract product, quantity, unit, unit price, date, payment state, amount received and fulfilment state.
- Test paid, partially paid and unpaid records.
- Test buyer identified, anonymous and unknown.
- Test local number words, dates, corrections and code-switching.
- Confirm the displayed total and payment balance before saving.
- Verify the backend rejects inconsistent totals and duplicate submission references.
- Confirm the saved record is marked farmer-reported and unverified.

## Farmer Sales Intelligence

- Ask for 30-day, 90-day and all-time totals.
- Compare recorded sales value with amounts received and outstanding balance.
- Ask for top products and month-by-month activity.
- Ask about repeat buyers without exposing buyer contact information.
- Confirm the assistant does not call recorded value verified revenue.
- Confirm an empty dataset is described as no records, not zero business activity beyond the selected period.

## Buyer-to-farmer matching

- Exact product and category match.
- Same category but wrong product name must not match.
- Same state and optional LGA preference.
- Quantity covered by recorded stock; insufficient stock excluded.
- Unknown stock shown as needing confirmation.
- Unit mismatch excluded.
- Budget above/below listing price.
- Expired needed-by date excluded.
- Buyer contact hidden without explicit consent and shown only with consent.
- A match is never labelled an order, reservation or completed sale.

## Sign-off criteria

For each language, record the prompt, transcript, extracted structured fields, assistant response, reviewer correction and pass/fail. A feature is not language-parity ready until native speakers approve the meaning and the backend invariants pass. Track ASR errors separately from assistant interpretation errors and translation/localization errors.

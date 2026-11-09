# Elevoni Dynamic ASR 1B integration

## Current design

- Customer and vendor voice recordings are uploaded to the existing Express transcription routes.
- `ASSISTANT_ASR_PROVIDER=dynamic-asr` selects the Modal provider; `openai` remains available as a rollback.
- The Node backend sends the recording to the private Modal HTTPS endpoint with a Bearer secret.
- Modal runs Dynamic ASR 1B `real/` on an A10 GPU and returns transcript text.
- OpenAI continues to handle assistant reasoning and response generation. ElevenLabs continues to handle speech generation.
- The selected language is returned as metadata, but Dynamic ASR 1B is language-agnostic and receives no language hint.

## Modal deployment

See `modal-asr/README.md`. The deployed app is `elevoni-dynamic-asr-1b`. It reuses the existing Modal secret `elevoni-asr-secret` and environment key `ELEVONI_ASR_API_KEY`.

## Customer cart actions

The customer assistant now supports these cart operations for verified Elevoni Direct catalogue products:

- Set a product quantity (e.g. “I want 5 kilos of smoked catfish”).
- Add an additional quantity.
- Reduce a quantity or remove a product.
- Clear the cart.
- Open the cart or proceed to checkout.

The backend resolves the requested product against the visible Elevoni Direct catalogue before returning a cart action. The storefront applies the action through the existing StoreContext cart API and provides a “Go to cart” navigation button. It does not submit an order or make a payment automatically.

Independent Marketplace vendor listings remain enquiry-based and are not added to the current Elevoni Direct checkout cart. The assistant explains this boundary rather than presenting a vendor enquiry as a cart purchase.

## Verification status

Targeted cart-intent tests and JavaScript/Python syntax checks are included with the patch. A live Modal GPU inference, live OpenAI request, Vercel deployment and end-to-end browser checkout test still need to be run in the user's accounts.

# Elevoni Assistant Cart Actions + Dynamic ASR 1B

## Customer storefront assistant

The customer assistant can now execute cart changes through the existing StoreContext/cart API, then return a navigation action such as **Go to cart** or **Review cart and checkout**.

Supported requests include:

- “I want 5 kilos of smoked catfish” → set the verified Elevoni Direct product quantity to 5 kg.
- “Add another 2 kg of smoked catfish” → add 2 kg to the existing cart quantity.
- “Reduce smoked catfish by 1 kg” → reduce the quantity.
- “Remove smoked catfish from my cart” → remove that item.
- “Clear my cart” → clear visible, verified Direct catalogue items.
- “Show my cart” / “Go to cart” → navigate to `/cart`.
- “Take me to checkout” → navigate to `/order` for review.

The assistant does not submit orders or make payments. It checks the product against the visible Elevoni Direct catalogue before returning a cart mutation. It does not add independent Marketplace vendor listings to the current Direct checkout cart; those remain enquiry-based. Ambiguous product matches and unsupported/fractional quantities are not guessed.

## Dynamic ASR 1B

The Modal service now runs Modular's fine-tuned 1B `real/` checkpoint using PyTorch/fairseq2 on an A10 GPU. It replaces the Pocket 300M ONNX service. The backend provider selector routes both customer and vendor transcription through Modal when `ASSISTANT_ASR_PROVIDER=dynamic-asr`; OpenAI remains available as a rollback option. OpenAI continues to power assistant intelligence and ElevenLabs continues to power TTS.

The selected UI language is preserved as request metadata, but no language hint is passed to Dynamic ASR 1B because the model is language-agnostic.

## Environment variables

Backend Vercel Production:

```env
ASSISTANT_ASR_PROVIDER=dynamic-asr
DYNAMIC_ASR_MODAL_URL=<new 1B Modal HTTPS endpoint>
DYNAMIC_ASR_MODAL_API_KEY=<same secret value as Modal ELEVONI_ASR_API_KEY>
DYNAMIC_ASR_TIMEOUT_MS=150000
```

The Modal app reuses the existing Modal secret `elevoni-asr-secret` containing `ELEVONI_ASR_API_KEY`. The app name is now `elevoni-dynamic-asr-1b`, so copy the new URL printed by Modal into Vercel and redeploy the backend.

## Verification

- 37 targeted Node tests passed across buyer requirement extraction/validation/matching, sales insights period parsing, cart-intent matching, Dynamic ASR HTTP integration, vendor sales draft validation and customer listing criteria.
- - Changed backend JavaScript passed `node --check`.
- Changed React files passed TypeScript JSX parser checks.
- Modal Python file passed `py_compile`.
- Not verified in this workspace: Modal image build, live A10 GPU model load, real audio transcription, Vercel deployment, or end-to-end storefront cart/checkout in a browser.

## Licensing and operational caution

Dynamic ASR fine-tuned weights are CC BY-SA 4.0; the inference code is Apache-2.0. Preserve model attribution and review the share-alike obligations before distributing weights or derivative weights. Model performance on noisy, spontaneous and code-switched farmer speech still requires real Elevoni recordings and native-speaker evaluation.

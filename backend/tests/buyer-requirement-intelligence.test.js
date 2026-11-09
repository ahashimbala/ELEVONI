import test from "node:test";
import assert from "node:assert/strict";
import { interpretBuyerRequirement } from "../services/buyerRequirementIntelligence.js";

const responseFor = draft => ({ ok: true, status: 200, json: async () => ({ id: "resp_test", model: "gpt-4o-mini", output_text: JSON.stringify(draft) }) });
const validDraft = overrides => ({ productName: "Maize", category: "Food Crops", subcategory: "Grains & Cereals", quantity: 100, unit: "kg", state: "FCT", lga: "AMAC", deliveryArea: "Garki", neededBy: "", maxUnitPrice: null, condition: "", specifications: "", clarification: "", ...overrides });

test("buyer requirement interpretation preserves the original request and selected language", async () => {
  let sent;
  const result = await interpretBuyerRequirement({ message: "Ina bukatar buhun masara 100 a Abuja", language: "ha-NG", env: { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-4o-mini" }, fetchImpl: async (_url, options) => { sent = JSON.parse(options.body); return responseFor(validDraft()); } });
  assert.equal(result.productName, "Maize");
  assert.equal(result.quantity, 100);
  assert.equal(result.preferredLanguage, "ha-NG");
  assert.equal(result.sourceText, "Ina bukatar buhun masara 100 a Abuja");
  assert.match(sent.instructions, /Hausa/);
});

test("buyer requirement interpretation clears invalid enum combinations rather than trusting model output", async () => {
  const result = await interpretBuyerRequirement({ message: "Need some product", language: "yo-NG", env: { OPENAI_API_KEY: "test-key" }, fetchImpl: async () => responseFor(validDraft({ category: "Food Crops", subcategory: "Cattle" })) });
  assert.equal(result.category, "Food Crops");
  assert.equal(result.subcategory, "");
});

test("buyer requirement interpretation rejects unsupported languages before calling the provider", async () => {
  let called = false;
  await assert.rejects(() => interpretBuyerRequirement({ message: "Need maize", language: "fr-FR", env: { OPENAI_API_KEY: "test-key" }, fetchImpl: async () => { called = true; return responseFor(validDraft()); } }), /five supported languages/);
  assert.equal(called, false);
});

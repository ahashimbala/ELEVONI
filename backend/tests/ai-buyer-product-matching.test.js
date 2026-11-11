import test from "node:test";
import assert from "node:assert/strict";
import { matchBuyerToProductsAI } from "../services/aiBuyerProductMatching.js";

const requirement = { productName: "smoked catfish", category: "Catfish & Aquaculture", subcategory: "", quantity: 100, unit: "kg", state: "FCT Abuja", lga: "AMAC", preferredLanguage: "en-NG", sourceText: "Need smoked fish" };
const candidates = [
  { _id: "direct-1", name: "Oven dried smoked catfish", category: "Catfish & Aquaculture", price: 18000, unitOfMeasure: "kg", stockQuantity: 35, availability: "Available", vendorId: null, originLocation: { state: "Kano" } },
  { _id: "vendor-1", name: "Fresh chicken", category: "Livestock", price: 9000, unitOfMeasure: "kg", stockQuantity: 200, availability: "Available", vendorId: { businessName: "Farm Vendor" } }
];

function mockFetch(parsed) {
  return async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.model, "gpt-4o-mini");
    const prompt = JSON.parse(body.input[0].content);
    assert.equal(prompt.catalogueCandidates.length, 2);
    assert.equal(prompt.catalogueCandidates[0].seller, "Elevoni Farms (direct)");
    return { ok: true, json: async () => ({ status: "completed", model: "gpt-4o-mini", output_text: JSON.stringify(parsed) }) };
  };
}

test("AI returns a relevant partial match and keeps Elevoni Direct seller attribution", async () => {
  const result = await matchBuyerToProductsAI({ requirement, candidates, env: { OPENAI_API_KEY: "test" }, fetchImpl: mockFetch({ matches: [{ productId: "direct-1", fitScore: 88, explanation: "The product is smoked catfish; recorded stock covers only part of the requested quantity.", matches: ["Product identity matches"], differences: ["35kg recorded against 100kg requested", "Different state"], availabilityNote: "35kg currently recorded; remaining quantity requires confirmation." }] }) });
  assert.equal(result.matches.length, 1);
  assert.equal(String(result.matches[0].product._id), "direct-1");
  assert.equal(result.matches[0].product.vendorId, null);
  assert.equal(result.matches[0].fitScore, 88);
});

test("AI cannot inject a product that was not in the catalogue candidates", async () => {
  const result = await matchBuyerToProductsAI({ requirement, candidates, env: { OPENAI_API_KEY: "test" }, fetchImpl: mockFetch({ matches: [{ productId: "not-in-catalogue", fitScore: 99, explanation: "Invented", matches: [], differences: [], availabilityNote: "Available" }] }) });
  assert.equal(result.matches.length, 0);
});

test("empty catalogue returns no matches without calling the AI provider", async () => {
  const result = await matchBuyerToProductsAI({ requirement, candidates: [], env: {} });
  assert.deepEqual(result.matches, []);
});

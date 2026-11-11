import test from "node:test";
import assert from "node:assert/strict";
import { retrieveBuyerProductMatches } from "../services/buyerProductRetrieval.js";

const id1 = "64b000000000000000000001";
const id2 = "64b000000000000000000002";
function product(id, overrides = {}) {
  return { _id: id, name: "Yellow maize", description: "Dried maize grain", category: "Food Crops", subcategory: "Grains & Cereals", price: 900, unitOfMeasure: "kg", stockQuantity: 40, availability: "Available", status: "approved", isAvailable: true, vendorId: null, originLocation: { state: "FCT Abuja", lga: "AMAC" }, updatedAt: new Date(), ...overrides };
}
function modelWith(rows) {
  return { find(filter) {
    assert.equal(filter.status, "approved");
    assert.equal(filter.isAvailable, true);
    let query = {
      select() { return this; }, populate() { return this; }, sort() { return this; }, limit() { return this; },
      lean: async () => rows,
    };
    return query;
  } };
}
function openAIResponse(matches) {
  return async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.model, "gpt-4o-mini");
    return { ok: true, json: async () => ({ output_text: JSON.stringify({ matches }) }) };
  };
}

test("AI ranks real catalogue products and includes Elevoni Direct listings", async () => {
  const rows = [product(id1), product(id2, { name: "Brown beans", description: "Dried beans", vendorId: { businessName: "Green Farms", state: "Nasarawa" } })];
  const result = await retrieveBuyerProductMatches({ productName: "corn", quantity: 100, unit: "kg", state: "FCT" }, {
    ProductModel: modelWith(rows), env: { OPENAI_API_KEY: "test" }, fetchImpl: openAIResponse([{ productId: id1, score: 92, explanation: "Maize is commonly called corn and the listing is for maize grain.", matchedFactors: ["Corn/maize product identity"], differences: ["Recorded stock is below the requested quantity"] }])
  });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].sellerType, "elevoni_direct");
  assert.equal(result.matches[0].sellerName, "Elevoni Farms");
  assert.equal(result.matches[0].stockStatus, "partial");
  assert.equal(result.matches[0].stockQuantity, 40);
});

test("AI may return partial matches even when location or quantity does not fit", async () => {
  const rows = [product(id1, { originLocation: { state: "Kaduna", lga: "Zaria" }, stockQuantity: 10 })];
  const result = await retrieveBuyerProductMatches({ productName: "maize", quantity: 100, unit: "kg", state: "FCT" }, {
    ProductModel: modelWith(rows), env: { OPENAI_API_KEY: "test" }, fetchImpl: openAIResponse([{ productId: id1, score: 76, explanation: "The product itself is a strong match, although location and quantity differ.", matchedFactors: ["Product identity matches"], differences: ["Supplier is in Kaduna"] }])
  });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].matchScore, 76);
  assert.ok(result.matches[0].differences.some(item => item.includes("Kaduna")));
  assert.ok(result.matches[0].differences.some(item => item.includes("Only 10 kg")));
});

test("retrieval fallback still searches product names when OpenAI is unavailable", async () => {
  const result = await retrieveBuyerProductMatches({ productName: "maize" }, {
    ProductModel: modelWith([product(id1)]), env: {}, fetchImpl: async () => { throw new Error("should not be called without key"); }
  });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matchingMethod, "catalogue_fallback_ai_unavailable");
});

test("unrelated category listings are not returned as product matches", async () => {
  const result = await retrieveBuyerProductMatches({ productName: "maize" }, {
    ProductModel: modelWith([product(id2, { name: "Brown beans", description: "Dried beans", category: "Food Crops" })]), env: {}, fetchImpl: async () => { throw new Error("not used"); }
  });
  assert.equal(result.matches.length, 0);
});

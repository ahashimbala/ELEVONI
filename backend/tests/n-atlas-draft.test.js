import test from "node:test";
import assert from "node:assert/strict";
import { safeDraft, SUBCATEGORIES_BY_CATEGORY } from "../services/nAtlasDraft.js";
import { PRODUCT_CATEGORIES } from "../services/categoryNormalization.js";

test("listing draft validation covers every active Elevoni product category", () => {
  assert.deepEqual(Object.keys(SUBCATEGORIES_BY_CATEGORY).sort(), [...PRODUCT_CATEGORIES].sort());
  for (const category of PRODUCT_CATEGORIES) {
    const subcategory = SUBCATEGORIES_BY_CATEGORY[category][0];
    const draft = safeDraft({ name: "Test item", category, subcategory, quantity: 5, unit: "kg", price: 1200 });
    assert.equal(draft.category, category);
    assert.equal(draft.subcategory, subcategory);
  }
});

test("listing draft validation rejects unknown categories and category-mismatched subcategories", () => {
  const unknown = safeDraft({ name: "Test", category: "Unlisted category", subcategory: "Cattle", quantity: 2, unit: "kg", price: 100 });
  assert.equal(unknown.category, "");
  assert.equal(unknown.subcategory, "");
  const mismatched = safeDraft({ name: "Tomatoes", category: "Food Crops", subcategory: "Cattle", quantity: 2, unit: "kg", price: 100 });
  assert.equal(mismatched.category, "Food Crops");
  assert.equal(mismatched.subcategory, "");
});

test("listing draft validation does not invent missing quantity or price", () => {
  const draft = safeDraft({ name: "Maize", category: "Food Crops", subcategory: "Grains & Cereals", quantity: "unknown", unit: "kg", price: "" });
  assert.equal(draft.quantity, "");
  assert.equal(draft.price, "");
});

test("listing draft validation rejects a zero price because product creation requires a positive price", () => {
  const draft = safeDraft({ name: "Maize", category: "Food Crops", subcategory: "Grains & Cereals", quantity: 10, unit: "kg", price: 0 });
  assert.equal(draft.price, "");
});

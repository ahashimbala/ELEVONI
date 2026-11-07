import test from "node:test";
import assert from "node:assert/strict";
import { isValidProductSubcategory } from "../services/productCategoryValidation.js";

test("active subcategories are validated against their product category", () => {
  assert.equal(isValidProductSubcategory("Food Crops", "Grains & Cereals"), true);
  assert.equal(isValidProductSubcategory("Livestock & Meat", "Cattle"), true);
  assert.equal(isValidProductSubcategory("Poultry & Eggs", "Cattle"), false);
});

test("historical Smoked Catfish is not accepted for new listings", () => {
  assert.equal(isValidProductSubcategory("Catfish & Aquaculture", "Smoked Catfish"), false);
});

test("an unchanged historical Smoked Catfish value remains editable", () => {
  assert.equal(isValidProductSubcategory("Catfish & Aquaculture", "Smoked Catfish", { allowUnchangedLegacy: true }), true);
  assert.equal(isValidProductSubcategory("Fishery Products & Equipment", "Smoked Catfish", { allowUnchangedLegacy: true }), false);
});

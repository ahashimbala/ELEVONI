import test from "node:test";
import assert from "node:assert/strict";
import { LEGACY_PRODUCT_SUBCATEGORIES, PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "./categoryConstants.mjs";

test("product categories match the persisted product-category contract", () => {
  assert.deepEqual(PRODUCT_CATEGORIES, [
    "Catfish & Aquaculture",
    "Poultry & Eggs",
    "Livestock & Meat",
    "Fishery Products & Equipment",
    "Food Crops",
  ]);
  assert.deepEqual(Object.keys(SUBCATEGORIES_BY_CATEGORY).sort(), [...PRODUCT_CATEGORIES].sort());
});

test("Food Crops remains an active product category with its supported subcategories", () => {
  assert.deepEqual(SUBCATEGORIES_BY_CATEGORY["Food Crops"], [
    "Grains & Cereals", "Vegetables & Fruits", "Tubers & Starch",
  ]);
});

test("product units are unique and non-empty", () => {
  assert.equal(new Set(PRODUCT_UNITS).size, PRODUCT_UNITS.length);
  assert.ok(PRODUCT_UNITS.every((unit) => typeof unit === "string" && unit.length > 0));
});

test("legacy Smoked Catfish subcategory remains schema-valid but is not a new listing option", () => {
  assert.deepEqual(LEGACY_PRODUCT_SUBCATEGORIES, ["Smoked Catfish"]);
  assert.equal(Object.values(SUBCATEGORIES_BY_CATEGORY).flat().includes("Smoked Catfish"), false);
});

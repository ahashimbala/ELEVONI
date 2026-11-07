import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCT_CATEGORIES } from "../../shared/categoryConstants.mjs";
import {
  PUBLIC_CATEGORY_FILTER_KINDS,
  categoriesForVendor,
  isProductCategory,
  resolveProductCategoryFilter,
} from "../services/categoryNormalization.js";

test("every persisted Product.category value remains valid and filterable", () => {
  for (const category of PRODUCT_CATEGORIES) {
    assert.equal(isProductCategory(category), true, category);
    const result = resolveProductCategoryFilter(category);
    assert.equal(result.kind, PUBLIC_CATEGORY_FILTER_KINDS.FILTER, category);
    assert.equal(result.category, category, category);
  }
});

test("Food Crops vendor focus grants the aggregate Food Crops product category", () => {
  assert.deepEqual(categoriesForVendor({ productFocus: ["food-crops"] }), ["Food Crops"]);
});

test("Food Crops can coexist with other approved vendor product focuses", () => {
  const allowed = categoriesForVendor({ productFocus: ["poultry", "cattle", "food-crops", "fisheries"] });
  assert.deepEqual(allowed, ["Poultry & Eggs", "Livestock & Meat", "Fishery Products & Equipment", "Food Crops"]);
});

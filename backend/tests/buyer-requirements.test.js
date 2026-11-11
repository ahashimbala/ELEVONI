import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCT_CATEGORIES, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";
import { prepareBuyerRequirement, scoreBuyerRequirement, rankRequirementsForVendor } from "../services/buyerRequirements.js";

const base = (overrides = {}) => ({
  buyerName: "Ada Buyer", buyerContact: "+2348000000000", productName: "Maize", category: "Food Crops",
  subcategory: SUBCATEGORIES_BY_CATEGORY["Food Crops"][0], quantity: 100, unit: "kg", state: "FCT", lga: "AMAC",
  preferredLanguage: "ha-NG", contactConsent: false, ...overrides,
});

test("buyer requirement accepts all five supported languages without changing canonical category data", () => {
  for (const preferredLanguage of ["en-NG", "pcm-NG", "ha-NG", "ig-NG", "yo-NG"]) {
    const result = prepareBuyerRequirement(base({ preferredLanguage }));
    assert.equal(result.error, undefined);
    assert.equal(result.requirement.preferredLanguage, preferredLanguage);
    assert.ok(PRODUCT_CATEGORIES.includes(result.requirement.category));
  }
});

test("buyer requirement rejects invalid category, unit, quantity and missing contact", () => {
  assert.match(prepareBuyerRequirement(base({ category: "Other" })).error, /category/);
  assert.match(prepareBuyerRequirement(base({ unit: "basket" })).error, /unit/);
  assert.match(prepareBuyerRequirement(base({ quantity: 0 })).error, /Quantity/);
  assert.match(prepareBuyerRequirement(base({ buyerContact: "" })).error, /required/);
});

test("matching prioritizes same product type, location, budget and sufficient recorded stock", () => {
  const requirement = { productName: "Maize", category: "Food Crops", subcategory: SUBCATEGORIES_BY_CATEGORY["Food Crops"][0], quantity: 100, unit: "kg", state: "FCT", lga: "AMAC", maxUnitPrice: 500 };
  const product = { name: "Maize", category: "Food Crops", subcategory: requirement.subcategory, unitOfMeasure: "kg", stockQuantity: 150, price: 450 };
  const vendor = { state: "FCT", lga: "AMAC" };
  const scored = scoreBuyerRequirement(requirement, product, vendor);
  assert.equal(scored.stockStatus, "recorded_sufficient");
  assert.equal(scored.score, 100);
  assert.ok(scored.reasons.includes("Same LGA"));
});

test("unknown stock is not represented as sufficient and insufficient recorded stock is excluded", () => {
  const requirement = { category: "Food Crops", subcategory: "Grains & Cereals", quantity: 100, unit: "kg", state: "FCT", maxUnitPrice: null };
  const vendor = { state: "FCT" };
  const unknown = { category: "Food Crops", subcategory: "Grains & Cereals", unitOfMeasure: "kg", stockQuantity: 0, price: 100 };
  assert.equal(scoreBuyerRequirement(requirement, unknown, vendor).stockStatus, "unknown");
  const insufficient = { ...unknown, stockQuantity: 10 };
  assert.equal(rankRequirementsForVendor([{ ...requirement, _id: "r1" }], [insufficient], vendor).length, 0);
});

test("buyer matching does not expose or infer contact data in the scoring layer", () => {
  const requirement = { category: "Food Crops", subcategory: "Grains & Cereals", quantity: 10, unit: "kg", state: "FCT", maxUnitPrice: null, buyerContact: "+2348000000000" };
  const product = { category: "Food Crops", subcategory: "Grains & Cereals", unitOfMeasure: "kg", stockQuantity: 10, price: 100 };
  const score = scoreBuyerRequirement(requirement, product, { state: "FCT" });
  assert.equal(typeof score.score, "number");
  assert.equal(Object.hasOwn(score, "buyerContact"), false);
});

test("buyer matching does not suggest a different product merely because it shares a broad category", () => {
  const requirement = { productName: "Maize", category: "Food Crops", subcategory: "Grains & Cereals", quantity: 20, unit: "kg", state: "FCT", maxUnitPrice: null };
  const wrongProduct = { name: "Brown Beans", category: "Food Crops", subcategory: "Grains & Cereals", unitOfMeasure: "kg", stockQuantity: 100, price: 500 };
  const matches = rankRequirementsForVendor([requirement], [wrongProduct], { state: "FCT" });
  assert.equal(matches.length, 0);
});

test("customer matching returns a real product when location, category or requested quantity is not an exact fit", async () => {
  const { rankProductsForBuyer } = await import("../services/buyerRequirements.js");
  const requirement = { productName: "Maize", category: "Food Crops", subcategory: "Grains & Cereals", quantity: 100, unit: "kg", state: "FCT", lga: "AMAC", maxUnitPrice: 400 };
  const listing = { _id: "p1", name: "Yellow Corn", category: "Food Crops", subcategory: "Grains & Cereals", unitOfMeasure: "kg", stockQuantity: 35, price: 500, availability: "Available", originLocation: { state: "Kaduna", lga: "Zaria" }, vendorId: null };
  const results = rankProductsForBuyer(requirement, [listing]);
  assert.equal(results.length, 1);
  assert.equal(results[0].product._id, "p1");
  assert.equal(results[0].sellerName, "Elevoni Farms");
  assert.equal(results[0].stockStatus, "recorded_partial");
  assert.ok(results[0].reasons.some((reason) => reason.includes("below your requested")));
  assert.ok(results[0].reasons.some((reason) => reason.includes("above your stated budget")));
});

test("customer matching does not return unrelated products from the same broad category", async () => {
  const { rankProductsForBuyer } = await import("../services/buyerRequirements.js");
  const requirement = { productName: "Maize", category: "Food Crops", quantity: 10, unit: "kg", state: "FCT" };
  const unrelated = { _id: "p2", name: "Tomatoes", category: "Food Crops", subcategory: "Vegetables & Fruits", unitOfMeasure: "kg", stockQuantity: 100, price: 200, availability: "Available", vendorId: null };
  assert.equal(rankProductsForBuyer(requirement, [unrelated]).length, 0);
});

test("customer matching distinguishes Elevoni direct products from marketplace vendors", async () => {
  const { rankProductsForBuyer } = await import("../services/buyerRequirements.js");
  const requirement = { productName: "Smoked Catfish", category: "Catfish & Aquaculture", quantity: 5, unit: "kg", state: "FCT" };
  const products = [
    { _id: "direct", name: "Smoked Catfish", category: "Catfish & Aquaculture", unitOfMeasure: "kg", stockQuantity: 10, price: 25000, availability: "Available", vendorId: null, originLocation: { state: "FCT Abuja" } },
    { _id: "vendor", name: "Smoked Catfish", category: "Catfish & Aquaculture", unitOfMeasure: "kg", stockQuantity: 10, price: 24000, availability: "Available", vendorId: { _id: "v1", businessName: "Fish Farm Ltd", state: "Kano" } },
  ];
  const results = rankProductsForBuyer(requirement, products);
  assert.equal(results.length, 2);
  assert.equal(results.find((item) => item.product._id === "direct").sellerName, "Elevoni Farms");
  assert.equal(results.find((item) => item.product._id === "vendor").sellerName, "Fish Farm Ltd");
});

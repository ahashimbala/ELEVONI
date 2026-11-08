import test from "node:test";
import assert from "node:assert/strict";
import { buildListingFilter, isCatalogueOverviewRequest, normalizeCustomerCriteria, normalizeLgaName, normalizeStateName, rankCustomerListings } from "../services/nAtlasCustomerMatching.js";

test("customer criteria only accepts active category and matching subcategory", () => {
  const criteria = normalizeCustomerCriteria({
    intent: "search", category: "Food Crops", subcategory: "Grains & Cereals", keywords: ["rice"],
    state: "Kano", quantity: 20, unit: "bags",
  }, "I need 20 bags of rice in Kano");
  assert.equal(criteria.category, "Food Crops");
  assert.equal(criteria.subcategory, "Grains & Cereals");
  assert.equal(criteria.state, "Kano");
  assert.equal(criteria.quantity, 20);
  assert.equal(criteria.maxPrice, null);
  assert.equal(criteria.minPrice, null);
});

test("customer criteria does not invent a category when the request is general", () => {
  const criteria = normalizeCustomerCriteria({ intent: "general", keywords: [] }, "How does Elevoni work?");
  assert.equal(criteria.category, "");
  assert.equal(criteria.intent, "general");
});

test("smoked catfish can be matched to Elevoni's direct catalogue without inventing a marketplace category", () => {
  const criteria = normalizeCustomerCriteria({ intent: "search", keywords: [] }, "I want to buy smoked catfish");
  assert.equal(criteria.category, "");
  assert.equal(criteria.subcategory, "");
  assert.deepEqual(criteria.keywords, ["smoked catfish"]);
});

test("listing filter always restricts results to approved available vendor products", () => {
  const filter = buildListingFilter({
    category: "Poultry & Eggs", subcategory: "Poultry", keywords: ["chicken"],
    minPrice: null, maxPrice: 50000,
  }, ["vendor-a"]);
  assert.equal(filter.status, "approved");
  assert.equal(filter.isAvailable, true);
  assert.deepEqual(filter.availability, { $ne: "Out of stock" });
  assert.deepEqual(filter.vendorId.$in, ["vendor-a"]);
  assert.equal(filter.category, "Poultry & Eggs");
  assert.equal(filter.subcategory, "Poultry");
  assert.equal(filter.$or.length, 4);
});

test("ranking does not recommend a listing with known stock below the requested quantity", () => {
  const ranked = rankCustomerListings([
    { _id: "low", name: "Broiler chicken", unitOfMeasure: "piece", stockQuantity: 10, updatedAt: new Date("2026-01-02") },
    { _id: "enough", name: "Broiler chicken", unitOfMeasure: "piece", stockQuantity: 80, updatedAt: new Date("2026-01-01") },
    { _id: "unknown", name: "Broiler chicken", unitOfMeasure: "piece", stockQuantity: 0, updatedAt: new Date("2026-01-03") },
  ], { quantity: 50, unit: "pieces", keywords: ["chicken"], state: "", lga: "" });
  assert.deepEqual(ranked.map((item) => item.product._id), ["enough", "unknown"]);
  assert.equal(ranked[0].stockMatch, "sufficient");
  assert.equal(ranked[1].stockMatch, "not_confirmed");
});


test("Abuja and FCT are treated as the same location", () => {
  assert.equal(normalizeStateName("Abuja"), "fct");
  assert.equal(normalizeStateName("FCT Abuja"), "fct");
  assert.equal(normalizeStateName("Federal Capital Territory"), "fct");
  assert.equal(normalizeStateName("Lagos State"), "lagos");
  assert.equal(normalizeLgaName("Ikeja LGA"), "ikeja");
});

test("ordinary informational questions are not converted into product searches by a keyword alone", () => {
  const criteria = normalizeCustomerCriteria({ intent: "general", keywords: [] }, "How do I cook chicken?");
  assert.equal(criteria.intent, "general");
  assert.equal(criteria.category, "");
  assert.deepEqual(criteria.keywords, []);
});

test("a clear buying request can use conservative product aliases when extraction omits the category", () => {
  const criteria = normalizeCustomerCriteria({ intent: "general", keywords: [] }, "I want to buy 50 chickens");
  assert.equal(criteria.intent, "search");
  assert.equal(criteria.category, "Poultry & Eggs");
  assert.equal(criteria.subcategory, "Poultry");
});

test("stock is not rejected when the requested and listing units cannot be compared", () => {
  const ranked = rankCustomerListings([
    { _id: "vendor-listing", name: "Broiler chicken", unitOfMeasure: "kg", stockQuantity: 10 },
  ], { quantity: 50, unit: "birds", keywords: ["chicken"], state: "", lga: "" });
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].stockMatch, "not_confirmed");
});

test("per-unit price filters are applied only when the unit is a known Elevoni listing unit", () => {
  const comparable = normalizeCustomerCriteria({ intent: "search", keywords: ["rice"], maxPrice: 20000, unit: "bags" }, "Find rice below ₦20,000 per bag");
  assert.equal(comparable.unit, "bag");
  assert.equal(comparable.maxPrice, 20000);
  const comparableFilter = buildListingFilter(comparable, ["vendor-a"]);
  assert.equal(comparableFilter.unitOfMeasure, "bag");
  assert.equal(comparableFilter.price.$lte, 20000);
  const unclearUnit = normalizeCustomerCriteria({ intent: "search", keywords: ["chicken"], maxPrice: 20000, unit: "birds" }, "Find chickens below ₦20,000 per bird");
  assert.equal(unclearUnit.unit, "");
  assert.equal(unclearUnit.maxPrice, null);
});


test("broad product availability questions are classified as catalogue overviews", () => {
  assert.equal(isCatalogueOverviewRequest("What products are available on Elevoni?"), true);
  assert.equal(isCatalogueOverviewRequest("What does Elevoni sell?"), true);
  assert.equal(isCatalogueOverviewRequest("What products do you have?"), true);
  assert.equal(isCatalogueOverviewRequest("What do you have available?"), true);
  assert.equal(isCatalogueOverviewRequest("Show me all products on Elevoni"), true);
  assert.equal(isCatalogueOverviewRequest("Wetin una get?"), true);
  assert.equal(isCatalogueOverviewRequest("How does Elevoni work?"), false);

  const criteria = normalizeCustomerCriteria(
    { intent: "general", keywords: [] },
    "What products are available on Elevoni?"
  );
  assert.equal(criteria.intent, "overview");
  assert.deepEqual(criteria.keywords, []);
});

test("catalogue overview intent is preserved from model classification", () => {
  const criteria = normalizeCustomerCriteria(
    { intent: "overview", keywords: [], state: "Kano" },
    "Show me what is available"
  );
  assert.equal(criteria.intent, "overview");
  assert.equal(criteria.state, "Kano");
});

test("ranking can return more than the default eight listings for a catalogue overview", () => {
  const products = Array.from({ length: 15 }, (_, index) => ({
    _id: `item-${index}`,
    name: `Product ${index}`,
    unitOfMeasure: "kg",
    stockQuantity: 10,
  }));
  const ranked = rankCustomerListings(products, {
    quantity: null, unit: "", keywords: [], state: "", lga: "",
  }, 12);
  assert.equal(ranked.length, 12);
});

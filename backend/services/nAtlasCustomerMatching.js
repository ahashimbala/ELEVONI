import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";

const clean = (value, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const safeNumber = (value) => value === null || value === undefined || value === "" ? null : Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const normalizeUnit = (value) => {
  const unit = clean(value, 24).toLowerCase().replace(/s$/, "").replace(/\s+/g, " ");
  return ({ kilogram: "kg", kilo: "kg", tonne: "ton" })[unit] || unit;
};
export const normalizeStateName = (value) => {
  const state = clean(value, 80).toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").replace(/\s+state$/, "");
  return ["abuja", "fct", "fct abuja", "federal capital territory"].includes(state) ? "fct" : state;
};
export const normalizeLgaName = (value) => clean(value, 80).toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").replace(/\s+lga$/, "");
const CATEGORY_ALIASES = Object.freeze([
  { category: "Poultry & Eggs", subcategory: "Poultry", words: ["poultry", "chicken", "chickens", "broiler", "broilers", "layers", "eggs"] },
  { category: "Livestock & Meat", subcategory: "Cattle", words: ["cattle", "cow", "cows", "bull", "bulls"] },
  { category: "Livestock & Meat", subcategory: "Sheep", words: ["sheep", "ram", "rams", "lamb"] },
  { category: "Livestock & Meat", subcategory: "Goats", words: ["goat", "goats"] },
  { category: "Food Crops", subcategory: "Grains & Cereals", words: ["rice", "maize", "corn", "millet", "sorghum", "beans", "grain", "grains", "cereal"] },
  { category: "Food Crops", subcategory: "Vegetables & Fruits", words: ["tomato", "tomatoes", "pepper", "onion", "vegetable", "vegetables", "fruit", "fruits"] },
  { category: "Food Crops", subcategory: "Tubers & Starch", words: ["yam", "yams", "cassava", "potato", "potatoes", "tuber", "tubers"] },
  { category: "", subcategory: "", words: ["smoked catfish", "smoked fish"] },
  { category: "Catfish & Aquaculture", subcategory: "Catfish", words: ["catfish"] },
  { category: "Catfish & Aquaculture", subcategory: "Tilapia", words: ["tilapia"] },
  { category: "Fishery Products & Equipment", subcategory: "Fresh Fish", words: ["fresh fish", "fishery", "fisheries"] },
]);

export function normalizeCustomerCriteria(raw = {}, originalMessage = "") {
  const category = PRODUCT_CATEGORIES.includes(raw.category) ? raw.category : "";
  const validSubcategories = category ? (SUBCATEGORIES_BY_CATEGORY[category] || []) : [];
  const subcategory = validSubcategories.includes(raw.subcategory) ? raw.subcategory : "";
  const unit = PRODUCT_UNITS.find((item) => normalizeUnit(item) === normalizeUnit(raw.unit)) || "";
  const minPrice = unit ? safeNumber(raw.minPrice) : null;
  const maxPrice = unit ? safeNumber(raw.maxPrice) : null;
  const message = clean(originalMessage, 1200).toLowerCase();
  const productName = clean(raw.productName, 120);
  if (raw.intent !== "navigate" && (!category || !subcategory) && (raw.intent === "search" || /\b(find|buy|need|looking for|show me|get me|where can i get|i want)\b/.test(message))) {
    const alias = CATEGORY_ALIASES.find((item) => item.words.some((word) => message.includes(word)));
    if (alias) {
      return {
        intent: "search", productName, category: alias.category, subcategory: alias.subcategory,
        keywords: alias.words.filter((word) => message.includes(word)).slice(0, 4),
        state: clean(raw.state, 80), lga: clean(raw.lga, 80),
        minPrice, maxPrice,
        quantity: safeNumber(raw.quantity), unit, destination: "",
      };
    }
  }
  const intent = ["search", "navigate", "general", "demand"].includes(raw.intent) ? raw.intent : "general";
  const keywords = Array.isArray(raw.keywords)
    ? raw.keywords.filter((item) => typeof item === "string").map((item) => clean(item, 50)).filter(Boolean).slice(0, 5)
    : [];
  if (productName && !keywords.some((word) => word.toLowerCase() === productName.toLowerCase())) keywords.unshift(productName);
  const destination = ["marketplace", "livestock", "food-crops", "aquaculture-fishery", "smoked-catfish"].includes(raw.destination) ? raw.destination : "";
  return {
    intent, productName, category, subcategory, keywords,
    state: clean(raw.state, 80), lga: clean(raw.lga, 80),
    minPrice, maxPrice,
    quantity: safeNumber(raw.quantity), unit, destination,
  };
}

export function buildListingFilter(criteria, approvedVendorIds) {
  const filter = {
    status: "approved", isAvailable: true, availability: { $ne: "Out of stock" },
    vendorId: { $in: approvedVendorIds },
    ...(criteria.category ? { category: criteria.category } : {}),
    ...(criteria.subcategory ? { subcategory: criteria.subcategory } : {}),
    ...(criteria.unit ? { unitOfMeasure: criteria.unit } : {}),
  };
  if (criteria.minPrice !== null || criteria.maxPrice !== null) {
    filter.price = {};
    if (criteria.minPrice !== null) filter.price.$gte = criteria.minPrice;
    if (criteria.maxPrice !== null) filter.price.$lte = criteria.maxPrice;
  }
  const terms = criteria.keywords.filter((word) => word.length >= 2).slice(0, 5);
  if (terms.length) filter.$or = terms.flatMap((word) => {
    const expression = new RegExp(escapeRegex(word), "i");
    return [{ name: expression }, { description: expression }, { species: expression }, { subcategory: expression }];
  });
  return filter;
}

export function rankCustomerListings(products, criteria) {
  return [...products].map((product) => {
    const stockQuantity = Number(product.stockQuantity);
    const stockKnown = Number.isFinite(stockQuantity) && stockQuantity > 0;
    const requestedUnit = normalizeUnit(criteria.unit);
    const listingUnit = normalizeUnit(product.unitOfMeasure);
    const sameUnit = Boolean(requestedUnit && listingUnit && requestedUnit === listingUnit);
    const stockMatch = criteria.quantity === null ? "not_checked"
      : !sameUnit || !stockKnown ? "not_confirmed"
        : stockQuantity >= criteria.quantity ? "sufficient" : "insufficient";
    const text = `${product.name || ""} ${product.subcategory || ""} ${product.description || ""}`.toLowerCase();
    const keywordScore = criteria.keywords.reduce((score, word) => score + (text.includes(word.toLowerCase()) ? 3 : 0), 0);
    const vendorState = product.vendorId?.state || product.vendorId?.farmAddress?.state || product.originLocation?.state || "";
    const vendorLga = product.vendorId?.lga || product.vendorId?.farmAddress?.lga || product.originLocation?.lga || "";
    const stateMatch = criteria.state && normalizeStateName(vendorState) === normalizeStateName(criteria.state);
    const lgaMatch = criteria.lga && normalizeLgaName(vendorLga) === normalizeLgaName(criteria.lga);
    const score = keywordScore + (stateMatch ? 5 : 0) + (lgaMatch ? 4 : 0) + (stockMatch === "sufficient" ? 3 : 0);
    return { product, stockMatch, score };
  }).filter((item) => item.stockMatch !== "insufficient")
    .sort((a, b) => b.score - a.score || new Date(b.product.updatedAt || 0) - new Date(a.product.updatedAt || 0))
    .slice(0, 8);
}

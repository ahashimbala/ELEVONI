import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";
import { normalizeLgaName, normalizeStateName } from "./nAtlasCustomerMatching.js";

const text = (value, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const number = (value) => value === "" || value === null || value === undefined ? null : Number(value);
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const PRODUCT_WORD_ALIASES = Object.freeze({ maize: ["maize", "corn"], corn: ["maize", "corn"], chicken: ["chicken", "broiler", "poultry"], broiler: ["chicken", "broiler"], cow: ["cow", "cattle"], cattle: ["cow", "cattle"], ram: ["ram", "sheep"], sheep: ["ram", "sheep"], goat: ["goat", "goats"], tomato: ["tomato", "tomatoes"], tomatoes: ["tomato", "tomatoes"], yam: ["yam", "yams"], yams: ["yam", "yams"], beans: ["bean", "beans"], bean: ["bean", "beans"], catfish: ["catfish"], tilapia: ["tilapia"] });
const productTokens = value => text(value, 160).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(word => word.length > 2 && !["fresh", "dried", "frozen", "smoked", "live", "processed", "farm", "raised", "the", "and"].includes(word)).map(word => PRODUCT_WORD_ALIASES[word] || [word]).flat();
function productNameFits(requested, listed) {
  const wanted = [...new Set(productTokens(requested))];
  const available = new Set(productTokens(listed));
  if (!wanted.length || !available.size) return false;
  const overlap = wanted.filter(word => available.has(word)).length;
  return overlap > 0 && overlap / wanted.length >= 0.5;
}

export function prepareBuyerRequirement(body = {}, { userId = null, now = new Date() } = {}) {
  const buyerName = text(body.buyerName, 120);
  const buyerContact = text(body.buyerContact, 120);
  const productName = text(body.productName, 160);
  const category = text(body.category, 100);
  const subcategory = text(body.subcategory, 100);
  const unit = text(body.unit, 24);
  const state = text(body.state, 100);
  const lga = text(body.lga, 100);
  const quantity = number(body.quantity);
  const maxUnitPrice = number(body.maxUnitPrice);
  const preferredLanguage = text(body.preferredLanguage, 10) || "en-NG";
  const contactConsent = body.contactConsent === true;

  if (!buyerName || !buyerContact || !productName) return { error: "Buyer name, contact and product are required", status: 400 };
  if (category && !PRODUCT_CATEGORIES.includes(category)) return { error: "Choose a valid product category", status: 400 };
  if (subcategory && category && !(SUBCATEGORIES_BY_CATEGORY[category] || []).includes(subcategory)) return { error: "Choose a valid product type for the selected category", status: 400 };
  if (unit && !PRODUCT_UNITS.includes(unit)) return { error: "Choose a valid unit of measure", status: 400 };
  if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000)) return { error: "Quantity must be a positive number", status: 400 };
  if (maxUnitPrice !== null && (!Number.isFinite(maxUnitPrice) || maxUnitPrice < 0)) return { error: "Maximum unit price must be a valid non-negative amount", status: 400 };
  if (!["en-NG", "pcm-NG", "ha-NG", "ig-NG", "yo-NG"].includes(preferredLanguage)) return { error: "Choose one of the supported languages", status: 400 };

  let neededBy = null;
  if (body.neededBy) {
    neededBy = new Date(body.neededBy);
    if (Number.isNaN(neededBy.getTime()) || neededBy < new Date(now.getTime() - 86_400_000)) return { error: "Required date must be valid and cannot be in the past", status: 400 };
  }

  return { requirement: {
    buyerUserId: userId || null, buyerName, buyerContact,
    buyerBusinessName: text(body.buyerBusinessName, 120), productName, category, subcategory,
    quantity, unit, state, lga, deliveryArea: text(body.deliveryArea, 120), neededBy,
    maxUnitPrice: maxUnitPrice === null ? null : round(maxUnitPrice),
    condition: text(body.condition, 80), specifications: text(body.specifications, 1000),
    preferredLanguage, sourceText: text(body.sourceText, 1500), contactConsent,
    status: "open", matchCount: 0,
  } };
}

export function scoreBuyerRequirement(requirement, product, vendor = {}) {
  const sameCategory = !requirement.category || requirement.category === product.category;
  const productNameMatch = productNameFits(requirement.productName, product.name);
  const sameSubcategory = !requirement.subcategory || requirement.subcategory === product.subcategory;
  const sameUnit = !requirement.unit || requirement.unit === product.unitOfMeasure;
  const stock = Number(product.stockQuantity);
  const stockKnown = Number.isFinite(stock) && stock > 0;
  const stockSufficient = requirement.quantity !== null && requirement.quantity !== undefined && stockKnown && sameUnit && stock >= requirement.quantity;
  const state = vendor.state || vendor.farmAddress?.state || product.originLocation?.state || "";
  const lga = vendor.lga || vendor.farmAddress?.lga || product.originLocation?.lga || "";
  const stateMatch = !requirement.state || normalizeStateName(state) === normalizeStateName(requirement.state);
  const lgaMatch = Boolean(!requirement.lga || normalizeLgaName(lga) === normalizeLgaName(requirement.lga));
  const withinBudget = requirement.maxUnitPrice === null || Number(product.price) <= requirement.maxUnitPrice;
  const reasons = [];
  if (productNameMatch) reasons.push("Product name matches");
  if (sameCategory) reasons.push("Category matches");
  if (sameSubcategory && requirement.subcategory) reasons.push("Product type matches");
  if (stateMatch) reasons.push("Same state");
  if (lgaMatch) reasons.push("Same LGA");
  if (stockSufficient) reasons.push("Recorded stock covers requested quantity");
  if (withinBudget && requirement.maxUnitPrice !== null) reasons.push("Within stated budget");
  if (!stockKnown) reasons.push("Stock quantity needs confirmation");
  if (!sameUnit) reasons.push("Unit differs; confirm before proceeding");
  const score = (productNameMatch ? 25 : 0) + (sameCategory ? 20 : 0) + (sameSubcategory ? 15 : 0) + (stateMatch ? 15 : 0) + (lgaMatch ? 10 : 0) + (stockSufficient ? 10 : 0) + (withinBudget ? 5 : -15);
  return { score, reasons, stockStatus: !stockKnown ? "unknown" : !sameUnit ? "unit_mismatch" : stockSufficient ? "recorded_sufficient" : "recorded_insufficient", stateMatch, lgaMatch, withinBudget, sameCategory, sameSubcategory, productNameMatch };
}

export function rankRequirementsForVendor(requirements, products, vendor = {}) {
  const matches = [];
  for (const requirement of requirements) {
    const productMatches = products.map((product) => ({ product, ...scoreBuyerRequirement(requirement, product, vendor) }))
      .filter((item) => item.productNameMatch && item.withinBudget)
      .sort((a, b) => b.score - a.score);
    if (productMatches.length) matches.push({ requirement, bestProduct: productMatches[0].product, score: productMatches[0].score, reasons: productMatches[0].reasons, stockStatus: productMatches[0].stockStatus });
  }
  return matches.sort((a, b) => b.score - a.score || new Date(b.requirement.createdAt) - new Date(a.requirement.createdAt));
}

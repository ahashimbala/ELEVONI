import Product from "../models/Product.js";
import { createOpenAIResponse } from "./openaiApi.js";

const MAX_CATALOGUE_SCAN = 500;
const MAX_AI_CANDIDATES = 100;
const MAX_RESULTS = 12;
const schema = {
  name: "elevoni_buyer_product_matches",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            productId: { type: "string" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            explanation: { type: "string" },
            matchedFactors: { type: "array", items: { type: "string" } },
            differences: { type: "array", items: { type: "string" } }
          },
          required: ["productId", "score", "explanation", "matchedFactors", "differences"]
        }
      }
    },
    required: ["matches"]
  }
};

const clean = (value, max = 220) => String(value ?? "").trim().slice(0, max);
const normalize = value => clean(value, 500).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokens = value => normalize(value).split(/\s+/).filter(token => token.length > 1);
const SYNONYMS = {
  maize: ["maize", "corn"], corn: ["corn", "maize"], chicken: ["chicken", "broiler", "poultry"], broiler: ["broiler", "chicken", "poultry"],
  cow: ["cow", "cattle", "beef"], cattle: ["cattle", "cow", "beef"], goat: ["goat", "chevon"], sheep: ["sheep", "ram", "mutton"],
  ram: ["ram", "sheep", "mutton"], tomato: ["tomato", "tomatoes"], tomatoes: ["tomatoes", "tomato"], yam: ["yam", "yams"],
  beans: ["beans", "bean"], bean: ["bean", "beans"], catfish: ["catfish"], fish: ["fish", "catfish", "tilapia"],
  cassava: ["cassava", "garri", "tapioca"], garri: ["garri", "cassava"], rice: ["rice", "paddy"],
};
function expandedTerms(name) {
  const base = tokens(name);
  return [...new Set(base.flatMap(token => SYNONYMS[token] || [token]))];
}
function lexicalScore(query, product) {
  const wanted = expandedTerms(query);
  const haystack = normalize([product.name, product.description, product.species, product.subcategory, product.category, product.sector, product.condition].join(" "));
  if (!wanted.length || !haystack) return 0;
  const hits = wanted.filter(term => haystack.includes(term));
  const exactName = normalize(product.name) === normalize(query);
  const phrase = normalize(product.name).includes(normalize(query)) || normalize(query).includes(normalize(product.name));
  return Math.min(100, Math.round((hits.length / wanted.length) * 70) + (phrase ? 20 : 0) + (exactName ? 10 : 0));
}
function sellerDetails(product) {
  const vendor = product.vendorId && typeof product.vendorId === "object" ? product.vendorId : null;
  return {
    sellerName: vendor?.businessName || (product.vendorId ? "Approved marketplace supplier" : "Elevoni Farms"),
    sellerType: product.vendorId ? "marketplace_vendor" : "elevoni_direct",
    state: vendor?.state || vendor?.farmAddress?.state || product.originLocation?.state || "",
    lga: vendor?.lga || vendor?.farmAddress?.lga || product.originLocation?.lga || ""
  };
}
function stockFacts(product, request) {
  const quantity = Number(product.stockQuantity);
  const recorded = product.stockQuantity !== null && product.stockQuantity !== undefined && Number.isFinite(quantity) && quantity >= 0;
  const unit = clean(product.unitOfMeasure, 40);
  const sameUnit = !request.unit || normalize(unit) === normalize(request.unit);
  let status = "not_recorded";
  if (product.availability === "Pre-order" && (!recorded || quantity === 0)) status = "preorder_stock_unconfirmed";
  else if (product.availability === "Seasonal" && (!recorded || quantity === 0)) status = "seasonal_stock_unconfirmed";
  else if (recorded && quantity === 0) status = "recorded_zero";
  else if (recorded && !sameUnit) status = "unit_differs";
  else if (recorded && sameUnit) status = request.quantity && quantity < Number(request.quantity) ? "partial" : "recorded_quantity";
  return { stockQuantity: recorded ? quantity : null, stockStatus: status, unit, availability: product.availability || "Not specified" };
}
function toPublicMatch(product, aiMatch, request) {
  const seller = sellerDetails(product);
  const stock = stockFacts(product, request);
  const differences = [...(aiMatch?.differences || [])];
  if (request.state && seller.state && normalize(request.state) !== normalize(seller.state)) differences.push(`Listed location is ${seller.state}, not ${request.state}`);
  if (request.state && !seller.state) differences.push("Supplier location is not recorded");
  if (request.quantity && stock.stockStatus === "partial") differences.push(`Only ${stock.stockQuantity} ${stock.unit} recorded against ${request.quantity} ${request.unit || stock.unit} requested`);
  if (stock.stockStatus === "not_recorded") differences.push("Current stock quantity is not recorded; confirm availability");
  if (stock.stockStatus === "recorded_zero") differences.push("The listing currently records zero stock; confirm whether replenishment or pre-order is possible");
  if (stock.stockStatus === "unit_differs") differences.push(`Listing unit is ${stock.unit}; requested unit is ${request.unit}`);
  if (["preorder_stock_unconfirmed", "seasonal_stock_unconfirmed"].includes(stock.stockStatus)) differences.push("Listing is not confirmed as ready stock");
  return {
    productId: String(product._id), name: product.name, description: product.description || "", category: product.category || "", subcategory: product.subcategory || "",
    price: product.price, unit: stock.unit, ...stock, condition: product.condition || "", species: product.species || "",
    images: Array.isArray(product.images) ? product.images.slice(0, 3) : [], ...seller,
    matchScore: Math.max(0, Math.min(100, Number(aiMatch?.score) || 0)),
    matchExplanation: clean(aiMatch?.explanation || "This listing appears relevant based on its product details. Confirm the remaining details with the supplier.", 600),
    matchedFactors: (aiMatch?.matchedFactors || []).slice(0, 6).map(item => clean(item, 140)),
    differences: [...new Set(differences.map(item => clean(item, 160)))].slice(0, 8)
  };
}

export async function retrieveBuyerProductMatches(request, { env = process.env, fetchImpl = fetch, ProductModel } = {}) {
  const productName = clean(request?.productName, 160);
  if (!productName) return { matches: [], matchingMethod: "none", scannedCount: 0 };
  const filter = { status: "approved", isAvailable: true, availability: { $ne: "Out of stock" } };
  const Model = ProductModel || Product;
  const projection = "name description price category subcategory unitOfMeasure species condition productionMethod weightRange sector availability stockQuantity vendorId originLocation images updatedAt";
  const searchTerms = expandedTerms(productName).slice(0, 12);
  const searchFilter = searchTerms.length ? { ...filter, $or: searchTerms.flatMap(term => {
    const pattern = new RegExp(escapeRegex(term), "i");
    return [{ name: pattern }, { description: pattern }, { species: pattern }, { subcategory: pattern }, { category: pattern }];
  }) } : filter;
  const [termMatches, recentCatalogue] = await Promise.all([
    Model.find(searchFilter).select(projection).populate("vendorId", "businessName state lga farmAddress").sort({ updatedAt: -1 }).limit(MAX_CATALOGUE_SCAN).lean(),
    Model.find(filter).select(projection).populate("vendorId", "businessName state lga farmAddress").sort({ updatedAt: -1 }).limit(MAX_CATALOGUE_SCAN).lean()
  ]);
  const uniqueCatalogue = new Map();
  for (const product of [...termMatches, ...recentCatalogue]) uniqueCatalogue.set(String(product._id), product);
  const catalogue = [...uniqueCatalogue.values()];
  if (!catalogue.length) return { matches: [], matchingMethod: "ai_catalogue_rank", scannedCount: 0 };

  const rankedPool = catalogue.map(product => ({ product, lexical: lexicalScore(productName, product) }))
    .sort((a, b) => b.lexical - a.lexical || new Date(b.product.updatedAt || 0) - new Date(a.product.updatedAt || 0))
    .slice(0, MAX_AI_CANDIDATES);
  const candidates = rankedPool.map(({ product }) => ({
    id: String(product._id), name: clean(product.name), description: clean(product.description, 260), category: clean(product.category, 100),
    subcategory: clean(product.subcategory, 100), species: clean(product.species, 80), condition: clean(product.condition, 60),
    price: Number(product.price), unit: clean(product.unitOfMeasure, 30), stockQuantity: Number(product.stockQuantity) || 0,
    availability: clean(product.availability, 40), location: sellerDetails(product).state, lga: sellerDetails(product).lga,
    seller: sellerDetails(product).sellerName
  }));

  let aiMatches = [];
  let matchingMethod = "ai_catalogue_rank";
  try {
    const result = await createOpenAIResponse({
      instructions: `You are Elevoni's agricultural product retrieval and relevance-ranking engine. Match the buyer's plain-language product request against ONLY the supplied real catalogue records. Understand Nigerian agricultural names, common synonyms, local wording, spelling variants and related product descriptions. Do not require category or subcategory equality. Product identity/relevance is the most important factor; then consider condition/species/specifications, delivery location, quantity and unit. Return relevant partial matches too; do not discard a relevant product just because location, quantity, unit or another preference differs. Do not invent products, stock, locations, prices, seller identities or facts. A score of 90-100 means the product itself is a very close match; 70-89 means a strong related match; 45-69 means a plausible/partial match; below 45 should normally be omitted unless it is the only plausible candidate. If no supplied product is relevant, return an empty array. Explain match quality in plain language. matchedFactors and differences must be grounded in the supplied records and buyer request. Stock is a database snapshot, not a guarantee. Buyer request: ${JSON.stringify({ productName, quantity: request.quantity ?? null, unit: request.unit || "", deliveryLocation: request.state || "", area: request.lga || "", extra: request.specifications || "", condition: request.condition || "" })}. Catalogue records: ${JSON.stringify(candidates)}. Return at most 12 best results.`,
      input: [{ role: "user", content: "Rank the supplied catalogue records for this buyer request." }],
      schema, maxOutputTokens: 2200, env, fetchImpl
    });
    const validIds = new Set(catalogue.map(product => String(product._id)));
    aiMatches = (result.parsed?.matches || []).filter(match => validIds.has(match.productId)).slice(0, MAX_RESULTS);
  } catch (error) {
    matchingMethod = "catalogue_fallback_ai_unavailable";
    // Keep relevant records visible if the AI provider is temporarily unavailable; never fabricate a match.
    aiMatches = rankedPool.filter(item => item.lexical >= 20).slice(0, MAX_RESULTS).map(({ product, lexical }) => ({
      productId: String(product._id), score: Math.min(75, lexical),
      explanation: "This listing shares product-name or description terms with your request. AI ranking is temporarily unavailable, so please review the details and confirm with the supplier.",
      matchedFactors: ["Product listing contains related terms"], differences: []
    }));
    // Empty fallback is an honest no-result state; the requirement is still retained.
    if (!aiMatches.length) matchingMethod = "catalogue_fallback_no_confident_match";
  }
  const byId = new Map(catalogue.map(product => [String(product._id), product]));
  const matches = aiMatches.map(match => toPublicMatch(byId.get(match.productId), match, request)).filter(match => match.matchScore >= 35);
  return { matches, matchingMethod, scannedCount: catalogue.length };
}

import { NAtlas } from "n-atlas";
import Product from "../models/Product.js";
import fishModel from "../models/fishModel.js";
import { CATALOGUE_QUERY } from "./catalogue.js";
import vendorProfileModel from "../models/vendorProfileModel.js";
import { PRODUCT_CATEGORIES, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";
import { NATLAS_SDK_TIMEOUT_MS } from "../../shared/natlasConfig.mjs";
import { createTimer } from "../utils/timingLogger.mjs";
import { getNAtlasProviderErrorDetails, mapNAtlasProviderError } from "../utils/natlasProviderErrors.js";
import { buildListingFilter, normalizeCustomerCriteria, normalizeLgaName, normalizeStateName, rankCustomerListings } from "./nAtlasCustomerMatching.js";

const MODEL_DEFAULT = "NCAIR1/N-ATLaS";
const LANGUAGE_HINTS = Object.freeze({ "en-NG": "en", "pcm-NG": "en", "ha-NG": "ha", "ig-NG": "ig", "yo-NG": "yo" });
const LANGUAGES = Object.freeze({
  "en-NG": "Nigerian English", "pcm-NG": "Nigerian Pidgin", "ha-NG": "Hausa", "ig-NG": "Igbo", "yo-NG": "Yoruba",
});
const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY = 8;
const clean = (value, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";

function getProvider() {
  const apiKey = process.env.NATLAS_API_KEY;
  const baseURL = clean(process.env.NATLAS_BASE_URL, 500).replace(/\/+$/, "");
  if (!apiKey || !baseURL) {
    const error = new Error("Elevoni Assistant is not configured. Set NATLAS_BASE_URL and NATLAS_API_KEY in the backend environment.");
    error.status = 503;
    error.code = "NATLAS_PROVIDER_NOT_CONFIGURED";
    throw error;
  }
  return { apiKey, baseURL, model: process.env.NATLAS_MODEL || MODEL_DEFAULT };
}

function extractObject(content) {
  if (content && typeof content === "object" && !Array.isArray(content)) return content;
  const text = clean(content, 8000);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return {};
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return {}; }
}

async function localizeCustomerReply({ language, fallback, abortSignal, timer }) {
  const provider = getProvider();
  const languageName = LANGUAGES[language] || LANGUAGES["en-NG"];
  const sdk = new NAtlas({ baseURL: provider.baseURL, apiKey: provider.apiKey, model: provider.model, timeout: NATLAS_SDK_TIMEOUT_MS, maxRetries: 0 });
  try {
    const result = await sdk.chat({
      messages: [
        { role: "system", content: `You are Elevoni Assistant. Translate the supplied short customer-service message into clear, everyday ${languageName} only. The selected language is ${language}; do not answer in English, mix languages, or add any information. Keep the meaning exact. Do not add product names, stock, prices, locations, promises or advice that is not in the source. Return only the translated message, with no quotation marks or explanation.` },
        { role: "user", content: fallback },
      ],
      language: LANGUAGE_HINTS[language] || "en", temperature: 0.1, maxTokens: 140,
      stream: false, signal: abortSignal, timeout: NATLAS_SDK_TIMEOUT_MS, maxRetries: 0,
    });
    const translated = clean(typeof result?.content === "string" ? result.content : "", 700).replace(/^['"“”]+|['"“”]+$/g, "");
    return translated || fallback;
  } catch (error) {
    timer?.log("customer-localization-fallback", getNAtlasProviderErrorDetails(error));
    return fallback;
  }
}

async function understandRequest({ message, language, history, abortSignal, timer }) {
  const provider = getProvider();
  const languageName = LANGUAGES[language] || LANGUAGES["en-NG"];
  const system = `You are Elevoni Assistant, Elevoni's customer-facing agricultural marketplace assistant. Understand the customer's request and extract search/navigation criteria. STRICT LANGUAGE RULE: the selected response language is ${languageName} (${language}). Keep all customer-facing replies and clarification questions in that language only. Never silently switch to English or mix languages. Preserve product names, locations, quantities and prices exactly. minPrice and maxPrice are per-unit price filters only when the user explicitly gives a per-unit budget; leave them null for an unclear total budget. Return ONLY valid JSON with keys: intent (search|navigate|general), category (one exact active Elevoni product category or empty), subcategory (exact category subcategory or empty), keywords (array of up to 5 product terms), state (Nigerian state or empty), lga (LGA or empty), minPrice (number or null), maxPrice (number or null), quantity (number or null), unit (short unit or empty), destination (marketplace|livestock|food-crops|aquaculture-fishery|smoked-catfish or empty). Do not invent missing details. Do not make up listings, prices, stock, farmers, delivery coverage or business policies. Only classify; the server will search real approved listings. If the customer asks to navigate, set intent=navigate and destination only when clear. If unsure, use general. Ask only one short clarification question at a time, in the selected language. Categories: ${PRODUCT_CATEGORIES.join(" | ")}. Subcategories: ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY)}. Conversation history is context, not a source of listing facts.`;
  const messages = (Array.isArray(history) ? history : []).slice(-MAX_HISTORY).map((item) => ({
    role: item?.role === "assistant" ? "assistant" : "user",
    content: clean(item?.text, 700),
  })).filter((item) => item.content);
  messages.push({ role: "user", content: clean(message, MAX_MESSAGE_LENGTH) });
  const sdk = new NAtlas({ baseURL: provider.baseURL, apiKey: provider.apiKey, model: provider.model, timeout: NATLAS_SDK_TIMEOUT_MS, maxRetries: 0 });
  let result;
  try {
    timer?.log("customer-sdk-request-start", { timeoutMs: NATLAS_SDK_TIMEOUT_MS });
    result = await sdk.chat({
      messages: [{ role: "system", content: system }, ...messages],
      language: LANGUAGE_HINTS[language] || "en", temperature: 0.1, maxTokens: 320,
      stream: false, signal: abortSignal, timeout: NATLAS_SDK_TIMEOUT_MS, maxRetries: 0,
    });
    timer?.log("customer-sdk-request-end");
  } catch (providerError) {
    timer?.log("customer-sdk-request-error", getNAtlasProviderErrorDetails(providerError));
    throw mapNAtlasProviderError(providerError, { abortSignal, operation: "chat" });
  }
  return normalizeCustomerCriteria(extractObject(result?.content), message);
}

function serialiseListing({ product, stockMatch }, criteria) {
  const vendor = product.vendorId && typeof product.vendorId === "object" ? product.vendorId : {};
  const state = vendor.state || vendor.farmAddress?.state || product.originLocation?.state || "";
  const lga = vendor.lga || vendor.farmAddress?.lga || product.originLocation?.lga || "";
  return {
    id: String(product._id), name: clean(product.name, 120), description: clean(product.description, 260),
    category: clean(product.category, 80), subcategory: clean(product.subcategory, 80),
    price: Number(product.price), unit: clean(product.unitOfMeasure, 24),
    image: Array.isArray(product.images) ? product.images[0] || "" : "",
    vendorName: clean(vendor.businessName, 120), state, lga, stockMatch,
    matchReasons: [criteria.subcategory ? "Product type" : criteria.category ? "Product category" : "Product name", criteria.state && normalizeStateName(state) === normalizeStateName(criteria.state) ? "State" : "", criteria.lga && normalizeLgaName(lga) === normalizeLgaName(criteria.lga) ? "LGA" : "", stockMatch === "sufficient" ? "Recorded stock quantity" : ""].filter(Boolean),
    availability: product.availability || (product.isAvailable ? "Listed as available" : "Not available"),
  };
}

function routeForDestination(destination) {
  return ({ marketplace: "/marketplace", livestock: "/category/livestock", "food-crops": "/category/food-crops", "aquaculture-fishery": "/category/aquaculture-fishery", "smoked-catfish": "/#fish-display" })[destination] || "";
}

export async function answerCustomerElevoniAssistant({ message, language = "en-NG", history = [], abortSignal, requestId }) {
  const timer = createTimer(requestId);
  timer.log("customer-request-start");
  const cleanMessage = clean(message, MAX_MESSAGE_LENGTH);
  if (!cleanMessage) {
    const error = new Error("Tell Elevoni Assistant what you are looking for."); error.status = 400; error.code = "ELEVONI_ASSISTANT_MESSAGE_EMPTY"; throw error;
  }
  if (!LANGUAGE_HINTS[language]) {
    const error = new Error("Choose one of Elevoni Assistant's supported languages."); error.status = 400; error.code = "ELEVONI_ASSISTANT_LANGUAGE_UNSUPPORTED"; throw error;
  }
  if (abortSignal?.aborted) {
    const error = new Error("Request cancelled."); error.status = 499; error.code = "NATLAS_CLIENT_ABORTED"; throw error;
  }
  const criteria = await understandRequest({ message: cleanMessage, language, history, abortSignal, timer });
  if (criteria.intent === "navigate" && criteria.destination) {
    return {
      reply: await localizeCustomerReply({ language, fallback: "I can take you there. Tap the button below to open that part of Elevoni.", abortSignal, timer }),
      navigation: { label: `Open ${criteria.destination === "food-crops" ? "Food Crops" : criteria.destination === "aquaculture-fishery" ? "Aquaculture & Fishery" : criteria.destination === "smoked-catfish" ? "Smoked Catfish" : criteria.destination[0].toUpperCase() + criteria.destination.slice(1)}`, path: routeForDestination(criteria.destination) },
      listings: [],
    };
  }
  if (/\b(near me|nearby|closest|close to me)\b/i.test(cleanMessage) && !criteria.state && !criteria.lga) {
    return {
      reply: await localizeCustomerReply({ language, fallback: "Tell me your state or town so I can look for nearby listings. I do not assume your location.", abortSignal, timer }),
      navigation: { label: "Browse the marketplace", path: "/marketplace" }, listings: [],
    };
  }
  if (!criteria.category && !criteria.subcategory && !criteria.keywords.length) {
    return {
      reply: await localizeCustomerReply({ language, fallback: "I can help you find livestock, food crops, aquaculture and fishery products. Tell me the product, quantity and the state or town you prefer.", abortSignal, timer }),
      navigation: { label: "Browse the marketplace", path: "/marketplace" }, listings: [],
    };
  }

  const approvedProfiles = await vendorProfileModel.find({ status: "approved" }).select("_id state lga farmAddress").lean();
  const locationProfiles = approvedProfiles.filter((profile) => {
    const state = profile.state || profile.farmAddress?.state || "";
    const lga = profile.lga || profile.farmAddress?.lga || "";
    return (!criteria.state || normalizeStateName(state) === normalizeStateName(criteria.state))
      && (!criteria.lga || normalizeLgaName(lga) === normalizeLgaName(criteria.lga));
  });
  const approvedVendorIds = (criteria.state || criteria.lga ? locationProfiles : approvedProfiles).map((profile) => profile._id);
  const filter = buildListingFilter(criteria, approvedVendorIds);
  const found = approvedVendorIds.length ? await Product.find(filter)
    .select("name description category subcategory price unitOfMeasure images vendorId originLocation stockQuantity availability isAvailable updatedAt")
    .populate("vendorId", "businessName state lga farmAddress status")
    .sort({ updatedAt: -1 }).limit(40).lean() : [];
  const listings = rankCustomerListings(found, criteria).map((item) => serialiseListing(item, criteria));
  const shouldSearchHouseFish = criteria.keywords.some((word) => /fish|catfish|smoked/i.test(word))
    || /smoked catfish|smoked fish|catfish/i.test(cleanMessage);
  if (shouldSearchHouseFish && !criteria.state && !criteria.lga) {
    const houseFish = await fishModel.find(CATALOGUE_QUERY)
      .select("name description price image category pricingMode pricingTiers")
      .limit(20).lean();
    const terms = criteria.keywords.map((word) => word.toLowerCase());
    for (const fish of houseFish) {
      const searchable = `${fish.name || ""} ${fish.description || ""} ${fish.category || ""}`.toLowerCase();
      if (terms.length && !terms.some((word) => searchable.includes(word))) continue;
      const firstTierPrice = Array.isArray(fish.pricingTiers) && fish.pricingTiers.length
        ? Number(fish.pricingTiers[0].unitPrice) : Number(fish.price);
      if (criteria.unit && criteria.unit !== "kg") continue;
      if (criteria.minPrice !== null && firstTierPrice < criteria.minPrice) continue;
      if (criteria.maxPrice !== null && firstTierPrice > criteria.maxPrice) continue;
      listings.push({
        id: String(fish._id), name: clean(fish.name, 120), description: clean(fish.description, 260),
        category: clean(fish.category || "Smoked Catfish", 80), subcategory: "Smoked Catfish",
        price: firstTierPrice, pricePrefix: fish.pricingMode === "tiered" ? "From" : "",
        unit: "kg", image: clean(fish.image, 500), vendorName: "Elevoni Farms",
        state: "", lga: "", stockMatch: "not_confirmed", matchReasons: ["Elevoni catalogue"], availability: "Check current availability with Elevoni",
        houseProduct: true,
      });
    }
  }
  if (!listings.length) {
    return {
      reply: await localizeCustomerReply({ language, fallback: criteria.state || criteria.lga ? "I could not find an approved listing matching those details in that location. Try another state or town, or browse all marketplace listings." : "I couldn't find an approved listing that matches those details right now. You can broaden the search by changing the product, location or budget. No supplier or stock has been assumed.", abortSignal, timer }),
      navigation: { label: "Browse all marketplace listings", path: "/marketplace" }, listings: [],
    };
  }
  const locationText = [criteria.lga, criteria.state].filter(Boolean).join(", ");
  const reply = await localizeCustomerReply({
    language,
    fallback: `I found matching listings${locationText ? ` for ${locationText}` : ""}. These are listings, not confirmed orders. Please confirm current stock, final price and delivery with Elevoni before paying.`,
    abortSignal,
    timer,
  });
  timer.log("customer-request-end", { matchedListings: listings.length, intent: criteria.intent });
  return { reply, navigation: { label: "See all marketplace listings", path: "/marketplace" }, listings, criteria: { category: criteria.category, subcategory: criteria.subcategory, state: criteria.state, lga: criteria.lga, quantity: criteria.quantity, unit: criteria.unit } };
}

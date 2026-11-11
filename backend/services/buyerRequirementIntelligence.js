import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";
import { createOpenAIResponse, ELEVONI_LANGUAGES, openAIError } from "./openaiApi.js";

const SUBCATEGORIES = [...new Set(Object.values(SUBCATEGORIES_BY_CATEGORY).flat())];
const schema = { name: "elevoni_buyer_requirement_draft", schema: {
  type: "object", additionalProperties: false,
  properties: {
    productName: { type: "string" }, category: { type: "string", enum: ["", ...PRODUCT_CATEGORIES] },
    subcategory: { type: "string", enum: ["", ...SUBCATEGORIES] }, quantity: { anyOf: [{ type: "number" }, { type: "null" }] },
    unit: { type: "string", enum: ["", ...PRODUCT_UNITS] }, state: { type: "string" }, lga: { type: "string" },
    deliveryArea: { type: "string" }, neededBy: { type: "string" }, maxUnitPrice: { anyOf: [{ type: "number" }, { type: "null" }] },
    condition: { type: "string" }, specifications: { type: "string" }, clarification: { type: "string" },
  }, required: ["productName", "category", "subcategory", "quantity", "unit", "state", "lga", "deliveryArea", "neededBy", "maxUnitPrice", "condition", "specifications", "clarification"],
} };

export async function interpretBuyerRequirement({ message, language = "en-NG", abortSignal, env = process.env, fetchImpl = fetch }) {
  const text = typeof message === "string" ? message.trim().slice(0, 1500) : "";
  if (!text) throw openAIError("Describe what you need before extracting the details.", 400, "BUYER_REQUIREMENT_MESSAGE_EMPTY");
  const selected = ELEVONI_LANGUAGES[language];
  if (!selected) throw openAIError("Choose one of Elevoni's five supported languages.", 400, "BUYER_REQUIREMENT_LANGUAGE_UNSUPPORTED");
  const result = await createOpenAIResponse({
    instructions: `You extract buyer requirements for Elevoni, a Nigerian agricultural marketplace. Understand natural requests in ${selected.name} (${language}), including code-switching. Return structured fields only. Translate the product name into a concise canonical English agricultural product name only when the meaning is clear; otherwise preserve the user's wording and ask for clarification. Use only the exact category, subcategory and unit enums supplied in this schema. Normalize local number words and quantities only when unambiguous. Return neededBy as YYYY-MM-DD when a calendar date is clearly stated; otherwise return an empty string. Convert a clearly stated Nigerian Naira budget into a per-unit maximum only if the buyer states it is per unit; otherwise leave maxUnitPrice null and mention the ambiguity in clarification. Never invent quantity, unit, state, date, budget, condition or specifications. If a required detail is missing, leave it empty/null and put one concise follow-up question in clarification, in ${selected.name}. If enough detail is present, clarification may be empty. Do not invent contact information or submit the requirement. Product categories: ${PRODUCT_CATEGORIES.join("; ")}. Subcategories: ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY)}. Units: ${PRODUCT_UNITS.join("; ")}.`,
    input: [{ role: "user", content: text }], schema, maxOutputTokens: 500, abortSignal, env, fetchImpl,
  });
  const draft = result.parsed || {};
  if (draft.category && !PRODUCT_CATEGORIES.includes(draft.category)) draft.category = "";
  if (draft.subcategory && !(SUBCATEGORIES_BY_CATEGORY[draft.category] || []).includes(draft.subcategory)) draft.subcategory = "";
  if (draft.unit && !PRODUCT_UNITS.includes(draft.unit)) draft.unit = "";
  return { ...draft, sourceText: text, preferredLanguage: language };
}


const explanationSchema = { name: "elevoni_product_match_explanations", schema: {
  type: "object", additionalProperties: false,
  properties: { explanations: { type: "array", items: { type: "object", additionalProperties: false, properties: { productId: { type: "string" }, explanation: { type: "string" }, strengths: { type: "array", items: { type: "string" } } }, required: ["productId", "explanation", "strengths"] } } },
  required: ["explanations"]
} };

export async function explainBuyerProductMatches({ requirement, matches, env = process.env, fetchImpl = fetch }) {
  if (!matches?.length) return [];
  const fallback = matches.map((match) => ({
    productId: String(match.product._id),
    explanation: `This listing matches the product you requested, is located in ${match.location.state}${match.location.lga ? `, ${match.location.lga}` : ""}, and its recorded stock covers your requested ${requirement.quantity} ${requirement.unit}. Please confirm that the stock is still available with the supplier.`,
    strengths: ["Requested product matches", "Location matches", "Recorded stock covers requested quantity"]
  }));
  if (!String(env.OPENAI_API_KEY || "").trim()) return fallback;
  try {
    const safeMatches = matches.slice(0, 8).map(({ product, location, score, reasons }) => ({ productId: String(product._id), product: product.name, category: product.category, type: product.subcategory || "", seller: product.vendorId ? "marketplace supplier" : "Elevoni Farms direct", location, price: product.price, unit: product.unitOfMeasure, recordedStock: product.stockQuantity, matchFactors: reasons, score }));
    const result = await createOpenAIResponse({
      instructions: `You explain why real Elevoni product listings match a buyer request. Use plain, concise Nigerian English. Only use the supplied buyer request and product facts. Do not invent availability, delivery, quality, seller reliability or guarantees. Explain product, location and quantity fit. If seller is Elevoni Farms direct, make clear that the product is offered directly by Elevoni; otherwise identify it as a marketplace supplier listing. Mention limitations and tell the buyer to confirm current stock, final price and delivery with the seller. Return one explanation for each supplied productId and do not add IDs.`,
      input: [{ role: "user", content: JSON.stringify({ buyerRequest: { product: requirement.productName, category: requirement.category, type: requirement.subcategory, quantity: requirement.quantity, unit: requirement.unit, state: requirement.state, lga: requirement.lga, maxUnitPrice: requirement.maxUnitPrice }, matches: safeMatches }) }],
      schema: explanationSchema, maxOutputTokens: 900, env, fetchImpl
    });
    const byId = new Map((result.parsed?.explanations || []).map((item) => [item.productId, item]));
    return fallback.map((item) => ({ ...item, ...(byId.get(item.productId) || {}) }));
  } catch {
    return fallback;
  }
}

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
    instructions: `You extract buyer requirements for Elevoni, a Nigerian agricultural marketplace. Understand natural requests in ${selected.name} (${language}), including code-switching. Return structured fields only. The buyer only needs to identify the product and delivery state. Translate the product name into a concise canonical English agricultural product name only when the meaning is clear; otherwise preserve the user's wording. Delivery state is mandatory: extract it only when explicitly stated, otherwise leave it empty and ask one concise question for the state. LGA/town is optional. Quantity and unit are optional; never invent them. Normalize local number words and quantities only when unambiguous. Return neededBy as YYYY-MM-DD when a calendar date is clearly stated; otherwise return an empty string. Convert a clearly stated Nigerian Naira budget into a per-unit maximum only if the buyer states it is per unit; otherwise leave maxUnitPrice null. Never invent date, budget, condition or specifications. Do not ask for category or product type. Do not invent contact information or submit the requirement. Product categories and subcategories may be inferred internally only as context, not as required buyer inputs: ${PRODUCT_CATEGORIES.join("; ")}. ${JSON.stringify(SUBCATEGORIES_BY_CATEGORY)}. Units: ${PRODUCT_UNITS.join("; ")}.`, 
    input: [{ role: "user", content: text }], schema, maxOutputTokens: 500, abortSignal, env, fetchImpl,
  });
  const draft = result.parsed || {};
  if (draft.category && !PRODUCT_CATEGORIES.includes(draft.category)) draft.category = "";
  if (draft.subcategory && !(SUBCATEGORIES_BY_CATEGORY[draft.category] || []).includes(draft.subcategory)) draft.subcategory = "";
  if (draft.unit && !PRODUCT_UNITS.includes(draft.unit)) draft.unit = "";
  return { ...draft, sourceText: text, preferredLanguage: language };
}

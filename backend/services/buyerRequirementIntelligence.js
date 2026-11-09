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

import { answerNAtlas } from "./nAtlasIntelligence.js";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";

const REQUIRED_FIELDS_BY_CATEGORY = Object.freeze({
  "Catfish & Aquaculture": ["species", "condition", "productionMethod", "weightRange", "unitOfMeasure", "originLocation"],
  "Poultry & Eggs": ["species", "condition", "unitOfMeasure", "originLocation"],
  "Livestock & Meat": ["species", "condition", "weightRange", "unitOfMeasure", "originLocation"],
  "Fishery Products & Equipment": ["species", "condition", "productionMethod", "unitOfMeasure", "originLocation"],
  "Food Crops": ["species", "unitOfMeasure", "originLocation"],
});

const plainText = (value, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Generate optional listing copy using the same authenticated vendor grounding
 * and guarded N-ATLaS service as chat. Nothing is published or saved here.
 */
export async function generateListingContent({
  vendorId,
  category,
  subcategory,
  price,
  unitOfMeasure,
  ...vendorFields
}) {
  if (!vendorId) {
    const error = new Error("An approved vendor profile is required to generate listing content.");
    error.status = 403;
    error.code = "NATLAS_VENDOR_REQUIRED";
    throw error;
  }
  if (!PRODUCT_CATEGORIES.includes(category)) {
    const error = new Error("Choose a supported Elevoni product category.");
    error.status = 400;
    error.code = "NATLAS_CATEGORY_INVALID";
    throw error;
  }
  if (subcategory && !(SUBCATEGORIES_BY_CATEGORY[category] || []).includes(subcategory)) {
    const error = new Error("Choose a subcategory that belongs to the selected product category.");
    error.status = 400;
    error.code = "NATLAS_SUBCATEGORY_INVALID";
    throw error;
  }
  if (!Number.isFinite(Number(price)) || Number(price) <= 0 || !PRODUCT_UNITS.includes(unitOfMeasure)) {
    const error = new Error("Enter a valid price and unit of measure.");
    error.status = 400;
    error.code = "NATLAS_LISTING_FIELDS_INVALID";
    throw error;
  }

  const requiredFields = REQUIRED_FIELDS_BY_CATEGORY[category] || [];
  const supplied = {};
  const missing = [];
  for (const field of requiredFields) {
    const value = vendorFields[field];
    if (value !== undefined && value !== null && value !== "") supplied[field] = value;
    else missing.push(field);
  }

  const prompt = [
    "Help me prepare copy for a product listing. This is a draft only; do not publish or save anything.",
    `Category: ${category}`,
    `Subcategory: ${subcategory || "Not supplied"}`,
    `Price (NGN): ${Number(price)}`,
    `Unit of measure: ${plainText(unitOfMeasure, 30)}`,
    `Vendor-provided details: ${JSON.stringify(supplied)}`,
    "In your reply, return a compact JSON object with title, description, attributes, summary and keywords.",
    "Use only supplied facts. Do not invent certification, breed, origin, production method, stock, delivery, quality claims or guarantees.",
    "If important details are missing, leave them out and identify them in a missing array.",
  ].join("\n");

  const response = await answerNAtlas({ vendorId, message: prompt, language: "en-NG" });
  let generated = {};
  try {
    const raw = response.reply.trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) generated = JSON.parse(raw.slice(start, end + 1));
  } catch {
    generated = {};
  }

  return {
    title: plainText(generated.title, 160),
    description: plainText(generated.description, 2000),
    attributes: generated.attributes && typeof generated.attributes === "object" && !Array.isArray(generated.attributes)
      ? generated.attributes
      : supplied,
    summary: plainText(generated.summary, 500),
    keywords: Array.isArray(generated.keywords) ? generated.keywords.filter((item) => typeof item === "string").slice(0, 10) : [],
    missing: Array.isArray(generated.missing) ? generated.missing.filter((item) => typeof item === "string").slice(0, 20) : missing,
    draft: response.draft,
  };
}

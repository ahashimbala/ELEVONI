import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";

export { SUBCATEGORIES_BY_CATEGORY };

const UNITS = new Set(PRODUCT_UNITS);
const cleanString = (value, max = 300) => typeof value === "string" ? value.trim().slice(0, max) : "";

/** Validate model-generated listing suggestions against every active form category. */
export function safeDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = {
    name: cleanString(value.name, 160),
    category: cleanString(value.category, 80),
    subcategory: cleanString(value.subcategory, 80),
    quantity: value.quantity === null || value.quantity === undefined ? "" : String(value.quantity).slice(0, 30),
    unit: cleanString(value.unit, 20),
    price: value.price === null || value.price === undefined ? "" : String(value.price).slice(0, 30),
    sourceText: cleanString(value.sourceText, 1000),
  };
  if (draft.category && !PRODUCT_CATEGORIES.includes(draft.category)) draft.category = "";
  if (draft.subcategory && !(SUBCATEGORIES_BY_CATEGORY[draft.category] || []).includes(draft.subcategory)) draft.subcategory = "";
  if (draft.unit && !UNITS.has(draft.unit)) draft.unit = "";
  if (draft.quantity && (!Number.isFinite(Number(draft.quantity)) || Number(draft.quantity) <= 0)) draft.quantity = "";
  if (draft.price && (!Number.isFinite(Number(draft.price)) || Number(draft.price) <= 0)) draft.price = "";
  return draft;
}

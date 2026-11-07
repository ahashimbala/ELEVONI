import { PRODUCT_CATEGORIES } from "./categoryNormalization.js";

export const SUBCATEGORIES_BY_CATEGORY = Object.freeze({
  "Catfish & Aquaculture": ["Catfish", "Tilapia", "Other Fish", "Other Aquaculture", "Fingerlings", "Juveniles", "Broodstock", "Fish Feed", "Pond & Tank Equipment", "Pumps & Aeration", "Water Testing", "Filtration", "Hatchery Services", "Aquaculture Consulting"],
  "Fishery Products & Equipment": ["Fresh Fish", "Smoked Fish", "Dried Fish", "Frozen Fish", "Fishing Nets", "Fishing Equipment", "Fish Processing", "Packaging & Storage", "Cold-chain Services"],
  "Poultry & Eggs": ["Poultry"],
  "Livestock & Meat": ["Cattle", "Sheep", "Goats"],
  "Food Crops": ["Grains & Cereals", "Vegetables & Fruits", "Tubers & Starch"],
});

const UNITS = new Set(["kg", "gram", "piece", "crate", "ton", "bag", "carton", "litre", "service", "hour"]);
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
  if (draft.price && (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0)) draft.price = "";
  return draft;
}

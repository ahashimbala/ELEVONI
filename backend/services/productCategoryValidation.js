import {
  LEGACY_PRODUCT_SUBCATEGORIES,
  SUBCATEGORIES_BY_CATEGORY,
} from "../../shared/categoryConstants.mjs";

export function isValidProductSubcategory(category, subcategory, { allowUnchangedLegacy = false } = {}) {
  if (!subcategory) return true;
  if ((SUBCATEGORIES_BY_CATEGORY[category] || []).includes(subcategory)) return true;
  return Boolean(
    allowUnchangedLegacy
    && category === "Catfish & Aquaculture"
    && LEGACY_PRODUCT_SUBCATEGORIES.includes(subcategory)
  );
}

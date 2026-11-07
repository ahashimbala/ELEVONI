// Canonical product-category values persisted in Product.category.
// These are intentionally distinct from taxonomy group headings such as
// "Aquaculture & Fishery" and "Livestock". Food Crops remains a supported
// listing category and stores its commodity group in Product.subcategory.

export const PRODUCT_CATEGORIES = Object.freeze([
  "Catfish & Aquaculture",
  "Poultry & Eggs",
  "Livestock & Meat",
  "Fishery Products & Equipment",
  "Food Crops",
]);

export const SUBCATEGORIES_BY_CATEGORY = Object.freeze({
  "Catfish & Aquaculture": Object.freeze([
    "Catfish", "Tilapia", "Other Fish", "Other Aquaculture", "Fingerlings", "Juveniles", "Broodstock",
    "Fish Feed", "Pond & Tank Equipment", "Pumps & Aeration", "Water Testing", "Filtration",
    "Hatchery Services", "Aquaculture Consulting",
  ]),
  "Poultry & Eggs": Object.freeze(["Poultry"]),
  "Livestock & Meat": Object.freeze(["Cattle", "Sheep", "Goats"]),
  "Fishery Products & Equipment": Object.freeze([
    "Fresh Fish", "Smoked Fish", "Dried Fish", "Frozen Fish", "Fishing Nets", "Fishing Equipment",
    "Fish Processing", "Packaging & Storage", "Cold-chain Services",
  ]),
  "Food Crops": Object.freeze(["Grains & Cereals", "Vegetables & Fruits", "Tubers & Starch"]),
});

// Historical records may still use this value. Keep it schema-valid without
// offering it as a new marketplace subcategory or N-ATLaS draft choice.
export const LEGACY_PRODUCT_SUBCATEGORIES = Object.freeze(["Smoked Catfish"]);

export const PRODUCT_UNITS = Object.freeze([
  "kg", "gram", "piece", "crate", "ton", "bag", "carton", "litre", "service", "hour",
]);

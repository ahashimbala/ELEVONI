// Mapping of top‑level marketplace categories to the product fields that are
// relevant for vendors when creating a listing.  The keys match the display
// values from PRODUCT_CATEGORIES.  Fields omitted here are considered optional
// or not applicable for that category.

export const CATEGORY_FIELD_MAP = {
  "Catfish & Aquaculture": [
    "species",
    "condition",
    "productionMethod",
    "weightRange",
    "unitOfMeasure",
    "originLocation",
  ],
  "Poultry & Eggs": [
    "species",
    "condition",
    "unitOfMeasure",
    "originLocation",
  ],
  "Livestock & Meat": [
    "species",
    "condition",
    "weightRange",
    "unitOfMeasure",
    "originLocation",
  ],
  "Fishery Products & Equipment": [
    "species",
    "condition",
    "productionMethod",
    "unitOfMeasure",
    "originLocation",
  ],
  "Food Crops": [
    "species", // here interpreted as crop type/variety
    "unitOfMeasure",
    "originLocation",
  ],
};

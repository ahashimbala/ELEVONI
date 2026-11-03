// Configuration-driven category information architecture.
//
// Every category and subcategory the storefront shows is declared here, so a
// new category can be added without rewriting the homepage, the category page
// or any component. Components read this file; they never hard-code a
// category name, slug or route.
//
// Availability rules encoded in this file:
//   - status "catalogue"  : the category is served by the live product
//                           catalogue. Its listings come from the API, never
//                           from this file.
//   - status "coming-soon": the category is planned but has no listings yet.
//   - status "reserved"   : the category is reserved for future expansion.
//
// A category is never presented as order-ready unless it is served by the
// live catalogue. Images are referenced by asset key so this module stays free
// of binary imports.

const CATEGORY_STATUS = Object.freeze({
    CATALOGUE: "catalogue",
    COMING_SOON: "coming-soon",
    RESERVED: "reserved",
});

const CATEGORIES = Object.freeze([
    Object.freeze({
        slug: "aquaculture-fishery",
        name: "Aquaculture & Fishery",
        eyebrow: "Category 01",
        summary: "Farm-prepared fish delivered with clear per-kilogram wholesale pricing.",
        status: CATEGORY_STATUS.CATALOGUE,
        media: Object.freeze({ key: "smoked_catfish_img4", alt: "Elevoni smoked catfish" }),
        children: Object.freeze([
            Object.freeze({
                slug: "smoked-catfish",
                name: "Smoked Catfish",
                summary: "Our signature product. Oven-smoked and sold per kilogram.",
                status: CATEGORY_STATUS.CATALOGUE,
                catalogue: "fish",
                media: Object.freeze({
                    key: "smoked_catfish_img4",
                    alt: "Elevoni smoked catfish",
                }),
            }),
            Object.freeze({
                slug: "catfish",
                name: "Catfish",
                summary: "Live, fresh or processed catfish listings from reviewed farms.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({
                    category: "Catfish & Aquaculture",
                    subcategory: "Catfish",
                }),
                media: null,
            }),
            Object.freeze({
                slug: "tilapia",
                name: "Tilapia",
                summary: "Tilapia and other farm-raised fish listings from reviewed vendors.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({
                    category: "Catfish & Aquaculture",
                    subcategory: "Tilapia",
                }),
                media: null,
            }),
            Object.freeze({
                slug: "other-fish",
                name: "Other Fish & Aquaculture",
                summary: "Other fish, fingerlings and aquaculture products from reviewed vendors.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({
                    category: "Catfish & Aquaculture",
                    subcategory: "Other Fish",
                }),
                media: null,
            }),
            Object.freeze({
                slug: "fingerlings-juveniles",
                name: "Fingerlings & Juveniles",
                summary: "Young fish and stocking materials from reviewed aquaculture vendors.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({ category: "Catfish & Aquaculture", subcategory: "Fingerlings" }),
                media: null,
            }),
            Object.freeze({
                slug: "fish-feed-equipment",
                name: "Fish Feed & Equipment",
                summary: "Feed, tanks, pumps, aeration and water-management supplies.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({ category: "Catfish & Aquaculture", subcategory: "Fish Feed" }),
                media: null,
            }),
            Object.freeze({
                slug: "fishery-products",
                name: "Fishery Products & Services",
                summary: "Fresh, smoked, dried and frozen fish, processing and cold-chain services.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({ category: "Fishery Products & Equipment", subcategory: "Fresh Fish" }),
                media: null,
            }),
        ]),
    }),
    Object.freeze({
        slug: "food-crops",
        name: "Food Crops",
        eyebrow: "Category 03",
        summary: "Explore grains, cereals, vegetables, fruits and tubers offered by food-crop vendors. Listings and availability depend on approved vendors.",
        status: CATEGORY_STATUS.CATALOGUE,
        media: null,
        children: Object.freeze([
            Object.freeze({ slug: "grains-cereals", name: "Grains & Cereals", summary: "Grains and cereal crops offered by approved vendors.", status: CATEGORY_STATUS.CATALOGUE, marketplace: Object.freeze({ category: "Food Crops", subcategory: "Grains & Cereals" }), media: null }),
            Object.freeze({ slug: "vegetables-fruits", name: "Vegetables & Fruits", summary: "Fresh vegetables and fruits offered by approved vendors.", status: CATEGORY_STATUS.CATALOGUE, marketplace: Object.freeze({ category: "Food Crops", subcategory: "Vegetables & Fruits" }), media: null }),
            Object.freeze({ slug: "tubers-starch", name: "Tubers & Starch", summary: "Tubers and starch crops offered by approved vendors.", status: CATEGORY_STATUS.CATALOGUE, marketplace: Object.freeze({ category: "Food Crops", subcategory: "Tubers & Starch" }), media: null }),
        ]),
    }),
    Object.freeze({
        slug: "livestock",
        name: "Livestock",
        eyebrow: "Category 02",
        summary: "Explore poultry, cattle, sheep and goat listings from reviewed vendors. Availability reflects actual approved listings.",
        status: CATEGORY_STATUS.CATALOGUE,
        media: {
            key: "livestockCategory",
            alt: "Cattle and goats grazing on a Nigerian farm",
        },
        children: Object.freeze([
            Object.freeze({
                slug: "poultry",
                name: "Poultry",
                summary: "Chicken and other table birds.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({
                    category: "Poultry & Eggs",
                    subcategory: "Poultry",
                }),
                media: null,
            }),
            Object.freeze({
                slug: "cattle",
                name: "Cattle",
                summary: "Beef and other cattle products.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({
                    category: "Livestock & Meat",
                    subcategory: "Cattle",
                }),
                media: null,
            }),
            Object.freeze({
                slug: "sheep",
                name: "Sheep",
                summary: "Mutton and other sheep products.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({
                    category: "Livestock & Meat",
                    subcategory: "Sheep",
                }),
                media: null,
            }),
            Object.freeze({
                slug: "goats",
                name: "Goats",
                summary: "Goat meat and other goat products.",
                status: CATEGORY_STATUS.CATALOGUE,
                marketplace: Object.freeze({
                    category: "Livestock & Meat",
                    subcategory: "Goats",
                }),
                media: null,
            }),
        ]),
    }),

]);

const CATEGORY_PATH_PREFIX = "/category";

const listCategories = () => CATEGORIES;

const getCategory = (slug) =>
    CATEGORIES.find((category) => category.slug === slug) || null;


const listSubcategories = (categorySlug) =>
    getCategory(categorySlug) ?
    getCategory(categorySlug).children || [] : [];



const getSubcategory = (categorySlug, childSlug) =>
    listSubcategories(categorySlug).find((child) => child.slug === childSlug) || null;

const categoryPath = (categorySlug, childSlug) =>
    childSlug ?
    `${CATEGORY_PATH_PREFIX}/${categorySlug}/${childSlug}` :
    `${CATEGORY_PATH_PREFIX}/${categorySlug}`;

// Resolves a storefront path into a single normalised entry. Returns null for
// unknown paths so the caller can render an honest "not found" state instead
// of an empty page.
const resolveCategoryEntry = (categorySlug, childSlug) => {
    const category = getCategory(categorySlug);
    if (!category) return null;

    if (!childSlug) {
        return {
            ...category,
            level: "category",
            parent: null,
            path: categoryPath(category.slug),
        };
    }

    const child = getSubcategory(category.slug, childSlug);
    if (!child) return null;

    return {
        ...child,
        level: "subcategory",
        parent: category,
        path: categoryPath(category.slug, child.slug),
    };
};

export {
    CATEGORIES,
    CATEGORY_PATH_PREFIX,
    CATEGORY_STATUS,
    categoryPath,
    getCategory,
    getSubcategory,
    listCategories,
    listSubcategories,
    resolveCategoryEntry,
};
export const validatePricingTiers = (tiers) => {
    if (!Array.isArray(tiers)) return "Pricing tiers must be an array";
    if (tiers.length === 0) return null;
    let expectedMinimum = 1;
    for (let index = 0; index < tiers.length; index += 1) {
        const tier = tiers[index];
        const minQuantity = tier?.minQuantity;
        const maxQuantity = tier?.maxQuantity;
        const unitPrice = tier?.unitPrice;
        const isFinal = index === tiers.length - 1;
        if (!Number.isSafeInteger(minQuantity) || minQuantity < 1) return "Tier minimum quantities must be positive whole numbers";
        if (minQuantity !== expectedMinimum) return "Pricing tiers must start at 1 and have no gaps or overlaps";
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) return "Tier prices must be positive finite numbers";
        if (maxQuantity === null) {
            if (!isFinal) return "Only the final pricing tier may be open-ended";
        } else {
            if (!Number.isSafeInteger(maxQuantity) || maxQuantity < minQuantity) return "Tier maximum quantities must be whole numbers greater than or equal to their minimum";
            if (isFinal) return "The final pricing tier must be open-ended";
            expectedMinimum = maxQuantity + 1;
        }
    }
    return tiers.at(-1)?.maxQuantity === null ? null : "The final pricing tier must be open-ended";
};

export const parsePricingTiers = (input) => {
    let tiers = input;
    if (typeof input === "string") {
        try { tiers = JSON.parse(input); }
        catch { throw new Error("Pricing tiers must be valid JSON"); }
    }
    if (!Array.isArray(tiers)) throw new Error("Pricing tiers must be an array");
    const normalized = tiers.map((tier) => ({
        minQuantity: tier?.minQuantity === "" ? NaN : Number(tier?.minQuantity),
        maxQuantity: tier?.maxQuantity === "" || tier?.maxQuantity === undefined ? null : tier?.maxQuantity === null ? null : Number(tier.maxQuantity),
        unitPrice: tier?.unitPrice === "" ? NaN : Number(tier?.unitPrice)
    }));
    const error = validatePricingTiers(normalized);
    if (error) throw new Error(error);
    return normalized;
};

export const validateProductPricing = ({ pricingMode, price, pricingTiers }) => {
    const tiers = Array.isArray(pricingTiers) ? pricingTiers : [];
    if (!Number.isFinite(price) || price <= 0) return "Product price must be a positive finite number";
    if (pricingMode !== "single" && pricingMode !== "tiered") return "pricingMode must be either single or tiered";
    if (pricingMode === "single" && tiers.length > 0) return "Single-priced products must not define pricing tiers";
    if (pricingMode === "tiered" && tiers.length === 0) return "Tiered products require configured pricing tiers";
    return validatePricingTiers(tiers);
};

export const getProductUnitPrice = (product, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error("Quantity must be a positive whole number");
    if (product?.pricingMode === "tiered") {
        const tiers = Array.isArray(product.pricingTiers) ? product.pricingTiers : [];
        if (tiers.length === 0) throw new Error("Tiered product pricing tiers are not configured");
        const tier = tiers.find(({ minQuantity, maxQuantity }) =>
            quantity >= minQuantity && (maxQuantity === null || quantity <= maxQuantity)
        );
        if (!tier) throw new Error("No pricing tier matches this quantity");
        return Number(tier.unitPrice);
    }
    const price = Number(product?.price);
    if (!Number.isFinite(price) || price <= 0) throw new Error("Product price is invalid");
    return price;
};
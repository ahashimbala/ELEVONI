const getProductPrice = (product, quantity) => {
    if (product?.pricingMode === "tiered") {
        const tiers = Array.isArray(product?.pricingTiers) ? product.pricingTiers : [];
        if (tiers.length === 0) return Number.NaN;
        const tier = tiers.find(({ minQuantity, maxQuantity }) =>
            quantity >= Number(minQuantity) &&
            (maxQuantity == null || quantity <= Number(maxQuantity))
        );
        return tier ? Number(tier.unitPrice) : Number.NaN;
    }
    return Number(product?.price);
};

export default getProductPrice;

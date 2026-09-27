import fishModel from "../models/fishModel.js";

const getProductPrice = (product, quantity) => {
    const isSmokedCatfish = product.name?.toLowerCase().includes("smoked catfish");
    if (!isSmokedCatfish) return Number(product.price);
    if (quantity >= 20) return 21000;
    if (quantity >= 10) return 22500;
    if (quantity >= 5) return 24000;
    return 25000;
};

const buildOrderSnapshot = async (items, ProductModel = fishModel) => {
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
        throw new Error("Order must contain between 1 and 50 items");
    }

    const snapshotItems = [];
    let subtotal = 0;
    for (const item of items) {
        const productId = item?.productId || item?.itemId || item?._id || item?.id;
        const quantity = Number(item?.quantity);
        if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) {
            throw new Error("Each item requires a product and a positive whole-number quantity");
        }

        const product = await ProductModel.findById(productId);
        if (!product) throw new Error("One or more products are no longer available");
        const unitPrice = getProductPrice(product, quantity);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("Product price is invalid");
        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;
        snapshotItems.push({
            productId: product._id,
            name: product.name,
            quantity,
            unit: "kg",
            unitPrice,
            lineTotal
        });
    }

    const deliveryFee = subtotal > 0 ? 2500 : 0;
    return { items: snapshotItems, subtotal, deliveryFee, totalAmount: subtotal + deliveryFee, currency: "NGN" };
};

const calculateOrderAmount = async (items) => (await buildOrderSnapshot(items)).totalAmount;

export { buildOrderSnapshot, calculateOrderAmount };

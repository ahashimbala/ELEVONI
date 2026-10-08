import fishModel from "../models/fishModel.js";
import { getProductUnitPrice } from "../services/productPricing.js";

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
        const unitPrice = getProductUnitPrice(product, quantity);
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
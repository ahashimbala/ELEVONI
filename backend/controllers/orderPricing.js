import fishModel from "../models/fishModel.js";

const calculateOrderAmount = async(items) => {
    let totalAmount = 0;

    if (!Array.isArray(items)) {
        throw new Error("Invalid order items");
    }

    for (const item of items) {
        const productId =
            item.itemId ||
            item.productId ||
            item._id ||
            item.id;

        const quantity = Number(item.quantity);

        if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Invalid product or quantity");
        }

        const product = await fishModel.findById(productId);

        if (!product) {
            throw new Error(`Product not found: ${productId}`);
        }

        const price = getProductPrice(product, quantity);

        totalAmount += price * quantity;
    }

    // Delivery fee
    if (totalAmount > 0) {
        totalAmount += 2500;
    }

    return totalAmount;
};
export { calculateOrderAmount };
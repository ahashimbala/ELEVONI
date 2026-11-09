import userModel from "../models/userModel.js"
import { logSafeError } from "../utils/safeLog.js";

const readItemId = (body) => {
    const itemId = body?.itemId;
    if (typeof itemId !== "string" || !itemId.trim()) return null;
    return itemId.trim();
}

// add items to user cart
const addToCart = async(req, res) => {
    try {
        const itemId = readItemId(req.body);
        if (!itemId) {
            return res.status(400).json({ success: false, message: "A product id is required" });
        }
        let userData = await userModel.findById(req.auth.userId);

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        let cartData = await userData.cartData;
        if (!cartData[itemId]) {
            cartData[itemId] = 1
        } else {
            cartData[itemId] += 1;
        }
        await userModel.findByIdAndUpdate(req.auth.userId, { cartData });
        return res.json({ success: true, message: "Added To Cart" });
    } catch (error) {
        logSafeError("Add-to-cart failed", error);
        return res.status(500).json({ success: false, message: "Unable to add item to cart" })
    }
}

// remove items from user cart
const removeFromCart = async(req, res) => {
    try {
        const itemId = readItemId(req.body);
        if (!itemId) {
            return res.status(400).json({ success: false, message: "A product id is required" });
        }
        let userData = await userModel.findById(req.auth.userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        let cartData = await userData.cartData;
        if (cartData[itemId] > 0) {
            cartData[itemId] -= 1;
        }
        await userModel.findByIdAndUpdate(req.auth.userId, { cartData });
        return res.json({ success: true, message: "Removed From Cart" })
    } catch (error) {
        logSafeError("Remove-from-cart failed", error);
        return res.status(500).json({ success: false, message: "Unable to remove item from cart" })
    }
}

// fetch user cart data
const getCart = async(req, res) => {
    try {
        let userData = await userModel.findById(req.auth.userId)
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        let cartData = await userData.cartData;
        return res.json({ success: true, cartData })
    } catch (error) {
        logSafeError("Get-cart failed", error);
        return res.status(500).json({ success: false, message: "Unable to load cart" })
    }
}


const setCartQuantity = async(req, res) => {
    try {
        const { itemId, quantity } = req.body || {};
        if (typeof itemId !== "string" || !itemId.trim() || !Number.isSafeInteger(quantity) || quantity < 0) {
            return res.status(400).json({ success: false, message: "A product and a non-negative whole-number quantity are required" });
        }

        const userData = await userModel.findById(req.auth.userId);
        if (!userData) return res.status(404).json({ success: false, message: "User not found" });

        const cartData = { ...(userData.cartData || {}) };
        if (quantity === 0) delete cartData[itemId];
        else cartData[itemId] = quantity;

        await userModel.findByIdAndUpdate(req.auth.userId, { cartData });
        return res.json({ success: true, message: "Cart quantity updated", cartData });
    } catch (error) {
        logSafeError("Set-cart-quantity failed", error);
        return res.status(500).json({ success: false, message: "Unable to update cart quantity" });
    }
};
export { addToCart, removeFromCart, getCart, setCartQuantity }

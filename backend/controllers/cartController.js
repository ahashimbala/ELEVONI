import userModel from "../models/userModel.js"

// add items to user cart
const addToCart = async(req, res) => {
    try {
        let userData = await userModel.findById(req.auth.userId);

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        let cartData = await userData.cartData;
        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = 1
        } else {
            cartData[req.body.itemId] += 1;
        }
        await userModel.findByIdAndUpdate(req.auth.userId, { cartData });
        res.json({ success: true, message: "Added To Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })

    }
}

// remove items from user cart
const removeFromCart = async(req, res) => {
    try {
        let userData = await userModel.findById(req.auth.userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        let cartData = await userData.cartData;
        if (cartData[req.body.itemId] > 0) {
            cartData[req.body.itemId] -= 1;
        }
        await userModel.findByIdAndUpdate(req.auth.userId, { cartData });
        res.json({ success: true, message: "Removed From Cart" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// fetch user cart data
const getCart = async(req, res) => {
    try {
        let userData = await userModel.findById(req.auth.userId)
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        let cartData = await userData.cartData;
        res.json({ success: true, cartData })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
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
        console.log("setCartQuantity error:", error);
        return res.status(500).json({ success: false, message: "Unable to update cart quantity" });
    }
};
export { addToCart, removeFromCart, getCart, setCartQuantity }
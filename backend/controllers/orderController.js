import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { calculateOrderAmount } from "./orderPricing.js";

const placeOrder = async(req, res) => {
    try {
        const {
            items,
            address,
            payment = false,
            paymentReference = null
        } = req.body;

        const userId = req.auth.userId;

        if (!userId) {
            return res.json({
                success: false,
                message: "User authentication required"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.json({
                success: false,
                message: "Order items are required"
            });
        }

        const amount = await calculateOrderAmount(items);

        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
            payment,
            paymentReference,
            status: payment ?
                "Order Placed" :
                "Order Placed (Pending WhatsApp)"
        });

        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, {
            cartData: {}
        });

        res.json({
            success: true,
            message: "Order successfully saved to database",
            orderId: newOrder._id
        });

    } catch (error) {
        console.log("Place Order Error:", error);

        res.json({
            success: false,
            message: error.message || "Error saving order to database"
        });
    }
};
const userOrders = async(req, res) => {
    try {
        const userId = req.auth.userId;

        if (!userId) {
            return res.json({
                success: false,
                message: "User authentication required"
            });
        }

        const orders = await orderModel.find({
            userId
        });

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.log("User Orders Error:", error);

        res.json({
            success: false,
            message: "Error retrieving orders"
        });
    }
};

const listOrders = async(req, res) => {
    try {
        const orders = await orderModel.find({});

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.log(error);

        res.json({
            success: false,
            message: "Error"
        });
    }
};

const updateStatus = async(req, res) => {
    try {
        await orderModel.findByIdAndUpdate(
            req.body.orderId, {
                status: req.body.status
            }
        );

        res.json({
            success: true,
            message: "Status Updated"
        });

    } catch (error) {
        console.log(error);

        res.json({
            success: false,
            message: "Error"
        });
    }
};

export {
    placeOrder,
    userOrders,
    listOrders,
    updateStatus
};
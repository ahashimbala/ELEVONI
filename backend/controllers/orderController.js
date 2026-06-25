import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";


const placeOrder = async(req, res) => {
    try {

        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            status: "Order Placed (Pending WhatsApp)"
        });


        await newOrder.save();


        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });


        res.json({
            success: true,
            message: "Order successfully saved to database",
            orderId: newOrder._id
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error saving order to database" });
    }
}


const userOrders = async(req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error retrieving orders" })
    }
}

// Listing orders for admin panel
const listOrders = async(req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// api for updating order status
const updateStatus = async(req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status })
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })

    }
}

export { placeOrder, userOrders, listOrders, updateStatus }
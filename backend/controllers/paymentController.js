import fishModel from "../models/fishModel.js";
import PaystackJS from "paystack-api";

const paystack = PaystackJS(process.env.PAYSTACK_SECRET_KEY);

const initializePayment = async(req, res) => {
    try {
        const { userId, items, amount, email } = req.body;

        const paystackResponse = await paystack.transaction.initialize({
            email: email,
            amount: amount * 100,
            callback_url: `${process.env.FRONTEND_URL}/verify-payment`,
            metadata: {
                userId,
                items
            }
        });

        res.json({
            success: true,
            authorization_url: paystackResponse.data.authorization_url,
            reference: paystackResponse.data.reference
        });

    } catch (error) {
        console.log("Paystack Init Error:", error);
        res.json({ success: false, message: "Payment initialization failed" });
    }
};

const verifyPayment = async(req, res) => {
    try {
        const { reference } = req.body;

        const verification = await paystack.transaction.verify({ reference });

        if (verification.data.status === "success") {
            res.json({ success: true, message: "Payment successful and verified" });
        } else {
            res.json({ success: false, message: "Payment verification failed" });
        }

    } catch (error) {
        console.log("Paystack Verify Error:", error);
        res.json({ success: false, message: "Error verifying payment" });
    }
};

export { initializePayment, verifyPayment };
import PaystackJS from "paystack-api";
import { calculateOrderAmount } from "./orderPricing.js";

const paystack = PaystackJS(process.env.PAYSTACK_SECRET_KEY);

const initializePayment = async(req, res) => {
    try {
        const { items, email } = req.body;

        if (!email || !Array.isArray(items) || items.length === 0) {
            return res.json({
                success: false,
                message: "Email and order items are required"
            });
        }

        const amount = await calculateOrderAmount(items);

        const paystackResponse = await paystack.transaction.initialize({
            email,
            amount: amount * 100,
            currency: "NGN",
            metadata: {
                items
            }
        });

        res.json({
            success: true,
            authorization_url: paystackResponse.data.authorization_url,
            reference: paystackResponse.data.reference,
            amount
        });

    } catch (error) {
        console.log("Paystack Init Error:", error);

        res.json({
            success: false,
            message: error.message || "Payment initialization failed"
        });
    }
};

const verifyPayment = async(req, res) => {
    try {
        const { reference, items } = req.body;

        if (!reference || !Array.isArray(items) || items.length === 0) {
            return res.json({
                success: false,
                message: "Payment reference and order items are required"
            });
        }

        const expectedAmount = await calculateOrderAmount(items);

        const verification = await paystack.transaction.verify({
            reference
        });

        const paymentData = verification.data;

        if (paymentData.status !== "success") {
            return res.json({
                success: false,
                message: "Payment was not successful"
            });
        }

        const paidAmount = Number(paymentData.amount);

        const expectedAmountInKobo = expectedAmount * 100;

        if (paidAmount !== expectedAmountInKobo) {
            console.log("Payment amount mismatch:", {
                expected: expectedAmountInKobo,
                received: paidAmount,
                reference
            });

            return res.json({
                success: false,
                message: "Payment amount does not match the order amount"
            });
        }

        res.json({
            success: true,
            message: "Payment successful and verified",
            amount: expectedAmount
        });

    } catch (error) {
        console.log("Paystack Verify Error:", error);

        res.json({
            success: false,
            message: "Error verifying payment"
        });
    }
};

export { initializePayment, verifyPayment };
import express from "express";
import { initializePayment, verifyPayment } from "../controllers/paymentController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const paymentRouter = express.Router();

paymentRouter.post("/initialize", authMiddleware, requireRole("customer"), initializePayment);
paymentRouter.post("/verify", authMiddleware, requireRole("customer"), verifyPayment);

export default paymentRouter;
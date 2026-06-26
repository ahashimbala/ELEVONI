import express from "express";
import { initializePayment, verifyPayment } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/initialize", initializePayment);
paymentRouter.post("/verify", verifyPayment);

export default paymentRouter;
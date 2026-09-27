import express from "express"
import authMiddleware, { requireRole } from "../middleware/auth.js"
import { listOrders, placeOrder, quoteOrder, updateStatus, userOrders } from "../controllers/orderController.js"

const orderRouter = express.Router();

orderRouter.post("/quote", authMiddleware, requireRole("customer"), quoteOrder)
orderRouter.post("/place", authMiddleware, requireRole("customer"), placeOrder);
orderRouter.post("/userorders", authMiddleware, requireRole("customer"), userOrders)
orderRouter.get("/list", authMiddleware, requireRole("admin"), listOrders)
orderRouter.post("/status", authMiddleware, requireRole("admin"), updateStatus)

export default orderRouter;
import express from "express"
import authMiddleware, { requireRole } from "../middleware/auth.js"
import { listOrders, placeOrder, quoteOrder, updateStatus, userOrders } from "../controllers/orderController.js"

const orderRouter = express.Router();

orderRouter.post("/quote", authMiddleware, requireRole("customer", "admin"), quoteOrder)
orderRouter.post("/place", authMiddleware, requireRole("customer", "admin"), placeOrder);
orderRouter.post("/userorders", authMiddleware, requireRole("customer", "admin"), userOrders)
orderRouter.get("/list", authMiddleware, requireRole("admin"), listOrders)
orderRouter.post("/status", authMiddleware, requireRole("admin"), updateStatus)

export default orderRouter;
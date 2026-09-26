import express from "express"
import { addToCart, removeFromCart, getCart } from "../controllers/cartController.js"
import authMiddleware, { requireRole } from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, requireRole("customer"), addToCart)
cartRouter.post("/remove", authMiddleware, requireRole("customer"), removeFromCart)
cartRouter.post("/get", authMiddleware, requireRole("customer"), getCart)

export default cartRouter;
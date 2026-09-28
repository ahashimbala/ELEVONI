import express from "express"
import { addToCart, removeFromCart, getCart, setCartQuantity } from "../controllers/cartController.js"
import authMiddleware, { requireRole } from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, requireRole("customer", "admin"), addToCart)
cartRouter.post("/remove", authMiddleware, requireRole("customer", "admin"), removeFromCart)
cartRouter.post("/get", authMiddleware, requireRole("customer", "admin"), getCart)
cartRouter.post("/set", authMiddleware, requireRole("customer", "admin"), setCartQuantity)

export default cartRouter;
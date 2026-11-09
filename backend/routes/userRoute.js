import express from "express";
import {
    loginUser,
    registerUser,
    googleLogin,
    completeGoogleSignup,
    currentUser,
    updateCheckoutProfile
} from "../controllers/userController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const userRouter = express.Router();
const loginLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 10, keyPrefix: "login", message: "Too many sign-in attempts. Please wait 15 minutes and try again." });
const registrationLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5, keyPrefix: "register", message: "Too many registration attempts. Please try again later." });
const googleLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 12, keyPrefix: "google-auth" });

userRouter.post("/register", registrationLimiter, registerUser);
userRouter.post("/login", loginLimiter, loginUser);
userRouter.post("/google", googleLimiter, express.urlencoded({ extended: false, limit: "32kb" }), googleLogin);
userRouter.post("/google/complete-signup", googleLimiter, completeGoogleSignup);
userRouter.get("/me", authMiddleware, currentUser);
userRouter.put("/checkout-profile", authMiddleware, requireRole("customer"), updateCheckoutProfile);

export default userRouter;
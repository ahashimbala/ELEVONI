import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { createPrivacyRequest } from "../controllers/privacyRequestController.js";

const router = express.Router();
const createLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 3, keyPrefix: "privacy-request", message: "Too many privacy requests from this connection. Please try again later." });

router.post("/", createLimiter, optionalAuth, createPrivacyRequest);

export default router;

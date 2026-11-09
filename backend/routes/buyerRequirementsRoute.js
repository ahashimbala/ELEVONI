import express from "express";
import { optionalAuth, verifyToken } from "../middleware/auth.js";
import requireApprovedVendorProfile from "../middleware/vendor.js";
import { createBuyerRequirement, interpretBuyerRequirementController, listVendorBuyerMatches } from "../controllers/buyerRequirementsController.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();
const interpretLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 8, keyPrefix: "buyer-interpret" });
const submitLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 5, keyPrefix: "buyer-submit" });
router.post("/interpret", interpretLimiter, optionalAuth, interpretBuyerRequirementController);
router.post("/", submitLimiter, optionalAuth, createBuyerRequirement);
router.get("/matches/vendor", verifyToken, requireApprovedVendorProfile(), listVendorBuyerMatches);
export default router;

import express from "express";
import { optionalAuth, verifyToken } from "../middleware/auth.js";
import requireApprovedVendorProfile from "../middleware/vendor.js";
import { createBuyerRequirement, interpretBuyerRequirementController, listVendorBuyerMatches } from "../controllers/buyerRequirementsController.js";

const router = express.Router();
router.post("/interpret", optionalAuth, interpretBuyerRequirementController);
router.post("/", optionalAuth, createBuyerRequirement);
router.get("/matches/vendor", verifyToken, requireApprovedVendorProfile(), listVendorBuyerMatches);
export default router;

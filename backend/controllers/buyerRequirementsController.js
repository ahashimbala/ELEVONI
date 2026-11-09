import BuyerRequirement from "../models/buyerRequirementModel.js";
import Product from "../models/Product.js";
import vendorProfileModel from "../models/vendorProfileModel.js";
import { prepareBuyerRequirement, rankRequirementsForVendor } from "../services/buyerRequirements.js";
import { interpretBuyerRequirement } from "../services/buyerRequirementIntelligence.js";

const buckets = new Map();
function allowSubmission(key, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= 10 * 60_000) {
    buckets.set(key, { startedAt: now, count: 1 });
    if (buckets.size > 5000) for (const [id, item] of buckets) if (now - item.startedAt >= 10 * 60_000) buckets.delete(id);
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export async function interpretBuyerRequirementController(req, res, next) {
  try {
    const key = `${String(req.ip || req.socket?.remoteAddress || "unknown")}:interpret`;
    if (!allowSubmission(key)) return res.status(429).json({ success: false, message: "Please wait before extracting another request." });
    const draft = await interpretBuyerRequirement({ message: req.body?.message, language: req.body?.language || "en-NG" });
    return res.status(200).json({ success: true, data: draft });
  } catch (error) {
    if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 600) return res.status(error.status).json({ success: false, message: error.message, code: error.code || "BUYER_REQUIREMENT_INTERPRET_ERROR" });
    return next(error);
  }
}

export async function createBuyerRequirement(req, res, next) {
  try {
    const key = String(req.ip || req.socket?.remoteAddress || "unknown");
    if (!allowSubmission(key)) return res.status(429).json({ success: false, message: "Please wait before submitting another buyer request." });
    const prepared = prepareBuyerRequirement(req.body, { userId: req.auth?.role === "customer" ? req.auth.id : null });
    if (prepared.error) return res.status(prepared.status || 400).json({ success: false, message: prepared.error });
    const requirement = await BuyerRequirement.create(prepared.requirement);
    return res.status(201).json({ success: true, message: "Your buying requirement has been submitted. Elevoni will use it to identify suitable approved suppliers.", data: { id: String(requirement._id), status: requirement.status } });
  } catch (error) { return next(error); }
}

export async function listVendorBuyerMatches(req, res, next) {
  try {
    const vendorId = req.vendor?.profileId;
    if (!vendorId) return res.status(403).json({ success: false, message: "An approved vendor profile is required" });
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const [vendor, products, requirements] = await Promise.all([
      vendorProfileModel.findById(vendorId).select("businessName state lga farmAddress").lean(),
      Product.find({ vendorId, status: "approved", isAvailable: true, availability: { $ne: "Out of stock" } })
        .select("name category subcategory price unitOfMeasure stockQuantity originLocation updatedAt").lean(),
      BuyerRequirement.find({ status: "open", $or: [{ neededBy: null }, { neededBy: { $gte: startOfToday } }] }).sort({ createdAt: -1 }).limit(300).lean(),
    ]);
    const matches = rankRequirementsForVendor(requirements, products, vendor || {}).slice(0, 50).map(({ requirement, bestProduct, score, reasons, stockStatus }) => ({
      requirement: {
        id: String(requirement._id), productName: requirement.productName, category: requirement.category,
        subcategory: requirement.subcategory, quantity: requirement.quantity, unit: requirement.unit,
        state: requirement.state, lga: requirement.lga, deliveryArea: requirement.deliveryArea,
        neededBy: requirement.neededBy, maxUnitPrice: requirement.maxUnitPrice,
        condition: requirement.condition, specifications: requirement.specifications,
        preferredLanguage: requirement.preferredLanguage, createdAt: requirement.createdAt,
        buyerName: requirement.contactConsent ? requirement.buyerName : "Buyer (contact details withheld)",
        buyerBusinessName: requirement.contactConsent ? requirement.buyerBusinessName : "",
        buyerContact: requirement.contactConsent ? requirement.buyerContact : "",
        contactConsent: requirement.contactConsent,
      },
      matchedProduct: { id: String(bestProduct._id), name: bestProduct.name, price: bestProduct.price, unit: bestProduct.unitOfMeasure, stockQuantity: bestProduct.stockQuantity },
      score, reasons, stockStatus,
    }));
    return res.status(200).json({ success: true, count: matches.length, data: matches });
  } catch (error) { return next(error); }
}

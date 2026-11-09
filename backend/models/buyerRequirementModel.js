import mongoose from "mongoose";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";

const ALL_SUBCATEGORIES = [...new Set(Object.values(SUBCATEGORIES_BY_CATEGORY).flat())];
const buyerRequirementSchema = new mongoose.Schema({
  buyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null, index: true },
  buyerName: { type: String, trim: true, required: true, maxlength: 120 },
  buyerContact: { type: String, trim: true, required: true, maxlength: 120 },
  buyerBusinessName: { type: String, trim: true, maxlength: 120, default: "" },
  productName: { type: String, trim: true, required: true, maxlength: 160 },
  category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
  subcategory: { type: String, enum: ["", ...ALL_SUBCATEGORIES], default: "" },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, enum: PRODUCT_UNITS, required: true },
  state: { type: String, trim: true, required: true, maxlength: 100 },
  lga: { type: String, trim: true, maxlength: 100, default: "" },
  deliveryArea: { type: String, trim: true, maxlength: 120, default: "" },
  neededBy: { type: Date, default: null },
  maxUnitPrice: { type: Number, min: 0, default: null },
  condition: { type: String, trim: true, maxlength: 80, default: "" },
  specifications: { type: String, trim: true, maxlength: 1000, default: "" },
  preferredLanguage: { type: String, enum: ["en-NG", "pcm-NG", "ha-NG", "ig-NG", "yo-NG"], default: "en-NG" },
  sourceText: { type: String, trim: true, maxlength: 1500, default: "" },
  contactConsent: { type: Boolean, default: false },
  status: { type: String, enum: ["open", "matched", "fulfilled", "cancelled", "expired"], default: "open", index: true },
  matchCount: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

buyerRequirementSchema.index({ status: 1, category: 1, subcategory: 1, state: 1, createdAt: -1 });
buyerRequirementSchema.index({ status: 1, neededBy: 1, createdAt: -1 });
buyerRequirementSchema.index({ buyerUserId: 1, createdAt: -1 });
export default mongoose.models.BuyerRequirement || mongoose.model("BuyerRequirement", buyerRequirementSchema);

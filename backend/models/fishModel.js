import mongoose from "mongoose";
import { validatePricingTiers } from "../services/productPricing.js";

const pricingTierSchema = new mongoose.Schema({
    minQuantity: { type: Number, required: true, min: 1 },
    maxQuantity: { type: Number, default: null, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const fishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    category: { type: String, required: true },
    visible: { type: Boolean, default: true },
    media: { type: [String], default: [] },
    pricingMode: { type: String, enum: ["single", "tiered"], default: "single" },
    pricingTiers: {
        type: [pricingTierSchema],
        default: [],
        validate: {
            validator: function(tiers) {
                if (validatePricingTiers(tiers) !== null) return false;
                return this.pricingMode === "tiered" ? tiers.length > 0 : tiers.length === 0;
            },
            message: "Tier schedules must be contiguous and end with one open-ended tier; tiered products require a schedule and single-priced products must not define tiers"
        }
    }
});

const fishModel = mongoose.models.fish || mongoose.model("fish", fishSchema);
export default fishModel;
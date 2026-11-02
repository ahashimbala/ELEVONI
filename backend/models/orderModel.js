import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "fish" },
    // Vendor attribution belongs to each item, not the parent order: one order may
    // contain products from several vendors. Null means this is an Elevoni house item.
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "vendorProfile", default: null, immutable: true },
    vendorBusinessName: { type: String, trim: true, maxlength: 120, default: "", immutable: true },
    sellerType: { type: String, enum: ["house", "vendor", "unknown"], default: "unknown", immutable: true },
    sellerBusinessName: { type: String, trim: true, maxlength: 120, immutable: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "kg" },
    unitPrice: { type: Number, min: 0 },
    lineTotal: { type: Number, min: 0 },
    // Keep unrecognized legacy item fields when older orders are hydrated.
}, { _id: false, strict: false });

// Vendor-owned items must carry both the profile reference and the snapshot of
// the vendor business name. House items deliberately keep vendorId null.
orderItemSchema.pre("validate", function requireVendorAttribution() {
    if (!this.isNew) return;
    const vendorBusinessName = typeof this.vendorBusinessName === "string"
        ? this.vendorBusinessName.trim()
        : "";
    const sellerBusinessName = typeof this.sellerBusinessName === "string"
        ? this.sellerBusinessName.trim()
        : "";

    if (this.sellerType === "house") {
        if (this.vendorId) {
            this.invalidate("vendorId", "House-owned items must not reference a vendor profile");
        }
        if (vendorBusinessName) {
            this.invalidate("vendorBusinessName", "House-owned items must not carry a vendor business name");
        }
        if (!sellerBusinessName) {
            this.invalidate("sellerBusinessName", "House-owned items require a seller business name");
        }
        return;
    }

    if (this.sellerType === "vendor") {
        if (!this.vendorId || !mongoose.Types.ObjectId.isValid(this.vendorId)) {
            this.invalidate("vendorId", "Vendor-owned items require a valid vendor profile");
        }
        if (!vendorBusinessName) {
            this.invalidate("vendorBusinessName", "Vendor-owned items require a vendor business name");
        }
        if (!sellerBusinessName) {
            this.invalidate("sellerBusinessName", "Vendor-owned items require a seller business name");
        } else if (sellerBusinessName !== vendorBusinessName) {
            this.invalidate("sellerBusinessName", "Vendor-owned items must use the vendor business name as the seller name");
        }
        return;
    }

    this.invalidate("sellerType", "New order items must be attributed to Elevoni or an external vendor");
});

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, min: 0 },
    deliveryFee: { type: Number, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },
    address: { type: Object, required: true },
    buyerIdentityStatus: { type: String, enum: ["identified", "anonymous", "unknown"], default: "unknown" },
    buyerName: { type: String, trim: true, maxlength: 160, default: "" },
    buyerContact: { type: String, trim: true, maxlength: 120, default: "" },
    buyerState: { type: String, trim: true, maxlength: 100, default: "" },
    buyerArea: { type: String, trim: true, maxlength: 120, default: "" },
    // Keep status/payment fields for compatibility with existing records and clients.
    status: { type: String, default: "Fish Processing" },
    orderStatus: {
        type: String,
        enum: ["pending", "pending confirmation", "confirmed", "processing", "out_for_delivery", "delivered", "cancelled", "failed"]
    },
    paymentStatus: { type: String, enum: ["pending", "successful", "failed", "unpaid"] },
    paymentMethod: { type: String, enum: ["paystack", "whatsapp_manual"] },
    source: { type: String, enum: ["online", "whatsapp_manual"] },
    date: { type: Date, default: Date.now },
    payment: { type: Boolean, default: false },
    paymentReference: { type: String, default: null },
    paidAt: { type: Date }
}, { timestamps: true });

// Supports vendor-level reporting over items embedded in orders. Each item keeps
// its own vendorId so mixed-vendor orders are attributed without double-counting.
orderSchema.index({ "items.vendorId": 1, date: -1 });
orderSchema.index({ paymentReference: 1 }, { unique: true, partialFilterExpression: { paymentReference: { $type: "string" } } });

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
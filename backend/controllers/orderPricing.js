import mongoose from "mongoose";
import fishModel from "../models/fishModel.js";
import vendorProfileModel from "../models/vendorProfileModel.js";
import { getProductUnitPrice } from "../services/productPricing.js";
import { isCatalogueVisible } from "../services/catalogue.js";

const HOUSE_SELLER_NAME = "Elevoni Farms";
const APPROVED_VENDOR_STATUS = "approved";

const vendorReferenceOf = (product) => {
    const populatedReference = typeof product?.populated === "function"
        ? product.populated("vendorId")
        : undefined;
    const reference = populatedReference ?? product?.vendorId?._id ?? product?.vendorId;
    if (reference === undefined || reference === null || reference === "") return null;
    return String(reference);
};

const approvedVendorName = (vendor) => {
    if (!vendor || vendor.status !== APPROVED_VENDOR_STATUS) return "";
    return typeof vendor.businessName === "string" ? vendor.businessName.trim() : "";
};

// Vendor attribution is always derived from the stored product record and the
// vendor profile. Request-supplied vendor IDs or names are ignored entirely.
const buildOrderSnapshot = async (
    items,
    ProductModel = fishModel,
    VendorProfileModel = vendorProfileModel
) => {
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
        throw new Error("Order must contain between 1 and 50 items");
    }
    const requestedItems = items.map((item) => {
        const productId = item?.productId || item?.itemId || item?._id || item?.id;
        const quantity = Number(item?.quantity);
        if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) {
            throw new Error("Each item requires a product and a positive whole-number quantity");
        }
        return { productId, quantity };
    });

    const productIds = [...new Set(requestedItems.map((item) => item.productId))];
    const products = await ProductModel.find({ _id: { $in: productIds } });
    const productsById = new Map((products || []).map((product) => [String(product._id), product]));

    const vendorReferences = [...new Set(
        (products || [])
            .map(vendorReferenceOf)
            .filter((reference) => reference !== null && mongoose.Types.ObjectId.isValid(reference))
    )];
    const vendors = vendorReferences.length > 0
        ? await VendorProfileModel.find({ _id: { $in: vendorReferences } })
        : [];
    const vendorsById = new Map((vendors || []).map((vendor) => [String(vendor._id), vendor]));

    const snapshotItems = [];
    let subtotal = 0;
    for (const { productId, quantity } of requestedItems) {
        const product = productsById.get(String(productId));
        if (!product || !isCatalogueVisible(product)) {
            throw new Error("One or more products are no longer available");
        }
        const unitPrice = getProductUnitPrice(product, quantity);
        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;

        const vendorReference = vendorReferenceOf(product);
        let vendorId = null;
        let vendorBusinessName = "";
        let sellerType = "house";
        let sellerBusinessName = HOUSE_SELLER_NAME;

        if (vendorReference !== null) {
            if (!mongoose.Types.ObjectId.isValid(vendorReference)) {
                throw new Error(`Product "${product.name}" has an invalid vendor relationship`);
            }

            const vendor = vendorsById.get(vendorReference);
            const businessName = approvedVendorName(vendor);

            if (!businessName) {
                throw new Error(
                    `Product "${product.name}" has no valid vendor attribution. Link it to an approved vendor profile before it can be ordered.`
                );
            }

            vendorId = vendor._id;
            vendorBusinessName = businessName;
            sellerType = "vendor";
            sellerBusinessName = businessName;
        }

        snapshotItems.push({
            productId: product._id,
            vendorId,
            vendorBusinessName,
            name: product.name,
            quantity,
            unit: "kg",
            unitPrice,
            lineTotal,
            // House items are Elevoni-owned catalogue products. External
            // marketplace listings remain enquiry-based and never enter checkout.
            sellerType,
            sellerBusinessName
        });
    }
    const deliveryFee = subtotal > 0 ? 2500 : 0;
    return { items: snapshotItems, subtotal, deliveryFee, totalAmount: subtotal + deliveryFee, currency: "NGN" };
};

const calculateOrderAmount = async (items) => (await buildOrderSnapshot(items)).totalAmount;
export { buildOrderSnapshot, calculateOrderAmount };

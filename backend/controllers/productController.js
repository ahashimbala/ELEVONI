import mongoose from "mongoose";
import { unlink } from "node:fs/promises";
import Product from "../models/Product.js";
import vendorProfileModel from "../models/vendorProfileModel.js";
import {
    PUBLIC_CATEGORY_FILTER_KINDS,
    categoriesForVendor,
    isProductCategory,
    resolveProductCategoryFilter,
} from "../services/categoryNormalization.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const validObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const currentUserId = (req) => req.auth && (req.auth.userId || req.auth.id);
const PRODUCT_UNITS = ["kg", "gram", "piece", "crate", "ton", "bag", "carton", "litre", "service", "hour"];
const ACTIVE_MARKETPLACE_CATEGORIES = ["Catfish & Aquaculture", "Poultry & Eggs", "Livestock & Meat", "Fishery Products & Equipment", "Food Crops"];
const SUBCATEGORIES_BY_CATEGORY = Object.freeze({
    "Catfish & Aquaculture": Object.freeze(["Catfish", "Tilapia", "Other Fish", "Other Aquaculture", "Fingerlings", "Juveniles", "Broodstock", "Fish Feed", "Pond & Tank Equipment", "Pumps & Aeration", "Water Testing", "Filtration", "Hatchery Services", "Aquaculture Consulting"]),
    "Fishery Products & Equipment": Object.freeze(["Fresh Fish", "Smoked Fish", "Dried Fish", "Frozen Fish", "Fishing Nets", "Fishing Equipment", "Fish Processing", "Packaging & Storage", "Cold-chain Services"]),
    "Poultry & Eggs": Object.freeze(["Poultry"]),
    "Livestock & Meat": Object.freeze(["Cattle", "Sheep", "Goats"]),
    "Food Crops": Object.freeze(["Grains & Cereals", "Vegetables & Fruits", "Tubers & Starch"])
});
const ALL_SUBCATEGORIES = Object.freeze([...new Set(Object.values(SUBCATEGORIES_BY_CATEGORY).flat())]);
const PRODUCT_CONDITIONS = Object.freeze(["Live", "Fresh", "Frozen", "Smoked", "Dried", "Processed"]);
const PRODUCTION_METHODS = Object.freeze(["Farm-raised", "Wild-caught", "Free-range", "Caged", "Other"]);
const FOCUS_FOR_SUBCATEGORY = Object.freeze({
    "Fresh Fish": "fisheries", "Smoked Fish": "fisheries", "Dried Fish": "fisheries", "Frozen Fish": "fisheries", "Fishing Nets": "fisheries", "Fishing Equipment": "fisheries", "Fish Processing": "fisheries", "Packaging & Storage": "fisheries", "Cold-chain Services": "fisheries",
    Poultry: "poultry",
    Cattle: "cattle",
    Sheep: "sheep",
    Goats: "goats",
    "Grains & Cereals": "food-crops",
    "Vegetables & Fruits": "food-crops",
    "Tubers & Starch": "food-crops",
    Catfish: "aquaculture",
    Tilapia: "aquaculture",
    "Other Fish": "aquaculture",
    "Other Aquaculture": "aquaculture", Fingerlings: "aquaculture", Juveniles: "aquaculture", Broodstock: "aquaculture", "Fish Feed": "aquaculture", "Pond & Tank Equipment": "aquaculture", "Pumps & Aeration": "aquaculture", "Water Testing": "aquaculture", Filtration: "aquaculture", "Hatchery Services": "aquaculture", "Aquaculture Consulting": "aquaculture"
});
const validSubcategoryForCategory = (category, subcategory) =>
    !subcategory || (SUBCATEGORIES_BY_CATEGORY[category] || []).includes(subcategory);
const requiredFocusForSubcategory = (subcategory) => FOCUS_FOR_SUBCATEGORY[subcategory] || null;
const profileForUser = (userId) => vendorProfileModel.findOne({ userId });

const productOwnerId = (product) => {
    if (product && product.vendorId && product.vendorId._id) {
        return String(product.vendorId._id);
    }

    if (product && product.vendorId) {
        return String(product.vendorId);
    }

    return null;
};

export const getPublicProducts = async(req, res, next) => {
    try {
        const { category, subcategory, search, minPrice, maxPrice, vendorId, condition, species, state, sector, limit = 20, page = 1 } = req.query;
        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
            return res.status(400).json({ success: false, message: "Invalid pagination parameters" });
        }

        if (
            (minPrice !== undefined && (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) ||
            (maxPrice !== undefined && (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0)) ||
            (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice))
        ) {
            return res.status(400).json({ success: false, message: "Invalid price range" });
        }

        const categoryFilter = resolveProductCategoryFilter(category);

        if (categoryFilter.kind === PUBLIC_CATEGORY_FILTER_KINDS.UNSUPPORTED) {
            return res.status(200).json({ success: true, count: 0, total: 0, page: pageNumber, pages: 0, data: [] });
        }

        const approvedProfiles = await vendorProfileModel.find({ status: "approved" }, "_id");
        const approvedIds = approvedProfiles.map((profile) => profile._id);

        const filter = {
            status: "approved",
            isAvailable: true,
            category: { $in: ACTIVE_MARKETPLACE_CATEGORIES },
            vendorId: { $in: approvedIds }
        };

        if (categoryFilter.kind === PUBLIC_CATEGORY_FILTER_KINDS.FILTER) {
            if (!ACTIVE_MARKETPLACE_CATEGORIES.includes(categoryFilter.category)) {
                return res.status(200).json({ success: true, count: 0, total: 0, page: pageNumber, pages: 0, data: [] });
            }

            filter.category = categoryFilter.category;
        }

        if (subcategory) {
            if (!ALL_SUBCATEGORIES.includes(String(subcategory))) {
                return res.status(400).json({ success: false, message: "Invalid product subcategory" });
            }

            filter.subcategory = String(subcategory);
        }

        if (sector) {
            if (!["Livestock", "Aquaculture", "Fisheries", "Food Crops"].includes(String(sector))) return res.status(400).json({ success: false, message: "Invalid marketplace sector" });
            filter.sector = String(sector);
        }

        if (condition) {
            if (!PRODUCT_CONDITIONS.includes(String(condition))) {
                return res.status(400).json({ success: false, message: "Invalid product condition" });
            }

            filter.condition = String(condition);
        }

        if (species) {
            filter.species = new RegExp(escapeRegex(species), "i");
        }

        if (state) {
            filter["originLocation.state"] = new RegExp(`^${escapeRegex(state)}$`, "i");
        }

        if (vendorId) {
            if (!validObjectId(vendorId) || !approvedIds.some((id) => String(id) === String(vendorId))) {
                return res.status(200).json({ success: true, count: 0, total: 0, page: pageNumber, pages: 0, data: [] });
            }

            filter.vendorId = vendorId;
        }

        if (search) {
            const expression = new RegExp(escapeRegex(search), "i");
            filter.$or = [
                { name: expression },
                { description: expression },
                { species: expression },
                { subcategory: expression }
            ];
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
            .populate("vendorId", "businessName location state lga farmAddress description productFocus status")
            .sort({ isFeatured: -1, createdAt: -1 })
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber),
            Product.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            count: products.length,
            total,
            page: pageNumber,
            pages: Math.ceil(total / limitNumber),
            data: products
        });
    } catch (error) {
        return next(error);
    }
};

export const getProductById = async(req, res, next) => {
    try {
        if (!validObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(req.params.id)
            .populate("vendorId", "businessName location state lga farmAddress description productFocus status");

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const isAdmin = req.auth && req.auth.role === "admin";
        const isOwner = Boolean(
            req.auth &&
            productOwnerId(product) &&
            req.vendor &&
            req.vendor.profileId &&
            productOwnerId(product) === String(req.vendor.profileId)
        );

        const isPublic = Boolean(
            product.status === "approved" &&
            product.isAvailable === true &&
            product.vendorId &&
            product.vendorId.status === "approved" &&
            ACTIVE_MARKETPLACE_CATEGORIES.includes(product.category)
        );

        if (!isPublic && !isAdmin && !isOwner) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.status(200).json({ success: true, data: product });
    } catch (error) {
        return next(error);
    }
};

export const createVendorProduct = async(req, res, next) => {
    try {
        const {
            name,
            description = "",
            price,
            category,
            subcategory = "",
            unitOfMeasure = "kg",
            stockQuantity = 0,
            images = [],
            media = [],
            originLocation = {},
            species = "",
            condition = "",
            productionMethod = "",
            weightRange = "",
            sector = "",
            availability = ""
        } = req.body || {};

        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 160 ||
            price === undefined ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0 ||
            !isProductCategory(category) ||
            !ACTIVE_MARKETPLACE_CATEGORIES.includes(category) ||
            !validSubcategoryForCategory(category, subcategory)
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a product name, positive price, and valid category"
            });
        }

        if ((sector && !["Livestock", "Aquaculture", "Fisheries", "Food Crops"].includes(sector)) || (availability && !["Available", "Pre-order", "Seasonal", "Out of stock"].includes(availability))) {
            return res.status(400).json({ success: false, message: "Choose a valid sector and availability status" });
        }

        if (
            (species && (typeof species !== "string" || species.trim().length > 80)) ||
            (condition && (!PRODUCT_CONDITIONS.includes(condition))) ||
            (productionMethod && (!PRODUCTION_METHODS.includes(productionMethod))) ||
            (weightRange && (typeof weightRange !== "string" || weightRange.trim().length > 60)) ||
            !PRODUCT_UNITS.includes(unitOfMeasure) ||
            !Array.isArray(images) ||
            images.some((image) => typeof image !== "string" || !/^https?:\/\//i.test(image)) ||
            !Array.isArray(media) ||
            media.length > 10 ||
            media.some((item) => !item || !["image", "video"].includes(item.type) || typeof item.url !== "string" || !/^https?:\/\//i.test(item.url)) ||
            !Number.isFinite(Number(stockQuantity)) ||
            Number(stockQuantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Images, unit of measure or stock quantity are invalid"
            });
        }

        if (req.auth.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Marketplace listings must be submitted by an approved vendor. Manage Elevoni-owned catfish in the existing catalogue."
            });
        }

        const profile = await profileForUser(currentUserId(req));

        if (!profile || profile.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "An approved vendor profile is required"
            });
        }

        const allowedCategories = categoriesForVendor(profile);

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "This category is outside the product focus selected in your vendor application"
            });
        }

        const requiredFocus = requiredFocusForSubcategory(subcategory);

        if (requiredFocus && !profile.productFocus.includes(requiredFocus)) {
            return res.status(400).json({
                success: false,
                message: "This product type is outside the product focus selected in your vendor application"
            });
        }

        const product = await Product.create({
            name: name.trim(),
            description: typeof description === "string" ? description.trim() : "",
            price: Number(price),
            category,
            subcategory,
            unitOfMeasure,
            stockQuantity: Number(stockQuantity),
            images: images.length ? images : media.filter((item) => item.type === "image").map((item) => item.url),
            media,
            species: typeof species === "string" ? species.trim() : "",
            condition,
            productionMethod,
            weightRange: typeof weightRange === "string" ? weightRange.trim() : "",
            sector: ["Livestock", "Aquaculture", "Fisheries", "Food Crops"].includes(sector) ? sector : (category === "Fishery Products & Equipment" ? "Fisheries" : category === "Catfish & Aquaculture" ? "Aquaculture" : category === "Food Crops" ? "Food Crops" : "Livestock"),
            availability: ["Available", "Pre-order", "Seasonal", "Out of stock"].includes(availability) ? availability : (Number(stockQuantity) > 0 ? "Available" : "Out of stock"),
            vendorId: profile._id,
            status: "pending",
            isAvailable: true,
            originLocation
        });

        return res.status(201).json({
            success: true,
            message: "Product submitted for administrative review",
            data: product
        });
    } catch (error) {
        return next(error);
    }
};

export const getMyVendorProducts = async(req, res, next) => {
    try {
        const profile = req.auth.role === "admin" ? null : await profileForUser(currentUserId(req));

        if (req.auth.role !== "admin" && (!profile || profile.status !== "approved")) {
            return res.status(403).json({
                success: false,
                message: "An approved vendor profile is required"
            });
        }

        const filter = req.auth.role === "admin" ? {} : { vendorId: profile._id };
        const products = await Product.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        return next(error);
    }
};

export const updateVendorProduct = async(req, res, next) => {
    try {
        if (!validObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        let profile = null;

        if (req.auth.role !== "admin") {
            profile = await profileForUser(currentUserId(req));

            if (!profile || profile.status !== "approved" || String(product.vendorId) !== String(profile._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You do not own this product listing."
                });
            }

            if (req.body.category !== undefined && !categoriesForVendor(profile).includes(req.body.category)) {
                return res.status(400).json({
                    success: false,
                    message: "This category is outside the product focus selected in your vendor application"
                });
            }

            const nextCategory = req.body.category !== undefined ? req.body.category : product.category;
            const nextSubcategory = req.body.subcategory !== undefined && req.body.subcategory !== null
                ? req.body.subcategory
                : product.subcategory;

            if (req.body.subcategory !== undefined && !validSubcategoryForCategory(nextCategory, req.body.subcategory)) {
                return res.status(400).json({
                    success: false,
                    message: "Choose a valid product type for the selected category"
                });
            }

            const requiredFocus = requiredFocusForSubcategory(nextSubcategory);

            if (requiredFocus && !profile.productFocus.includes(requiredFocus)) {
                return res.status(400).json({
                    success: false,
                    message: "This product type is outside the product focus selected in your vendor application"
                });
            }
        }

        if (req.body.name !== undefined && (typeof req.body.name !== "string" || req.body.name.trim().length < 2 || req.body.name.trim().length > 160)) {
            return res.status(400).json({ success: false, message: "Product name must be between 2 and 160 characters" });
        }

        if (req.body.price !== undefined && (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) <= 0)) {
            return res.status(400).json({ success: false, message: "Product price must be greater than zero" });
        }

        if (req.body.category !== undefined && (!isProductCategory(req.body.category) || !ACTIVE_MARKETPLACE_CATEGORIES.includes(req.body.category))) {
            return res.status(400).json({ success: false, message: "Choose an active marketplace category" });
        }

        if (req.body.subcategory !== undefined && req.body.subcategory !== "" && !ALL_SUBCATEGORIES.includes(req.body.subcategory)) {
            return res.status(400).json({ success: false, message: "Choose a valid product subcategory" });
        }

        if (req.body.condition !== undefined && req.body.condition !== "" && !PRODUCT_CONDITIONS.includes(req.body.condition)) {
            return res.status(400).json({ success: false, message: "Choose a valid product condition" });
        }

        if (req.body.productionMethod !== undefined && req.body.productionMethod !== "" && !PRODUCTION_METHODS.includes(req.body.productionMethod)) {
            return res.status(400).json({ success: false, message: "Choose a valid production method" });
        }

        if (req.body.species !== undefined && (typeof req.body.species !== "string" || req.body.species.trim().length > 80)) {
            return res.status(400).json({ success: false, message: "Species must be text no longer than 80 characters" });
        }

        if (req.body.weightRange !== undefined && (typeof req.body.weightRange !== "string" || req.body.weightRange.trim().length > 60)) {
            return res.status(400).json({ success: false, message: "Weight range must be text no longer than 60 characters" });
        }

        if (req.body.unitOfMeasure !== undefined && !PRODUCT_UNITS.includes(req.body.unitOfMeasure)) {
            return res.status(400).json({ success: false, message: "Invalid unit of measure" });
        }

        if (req.body.stockQuantity !== undefined && (!Number.isFinite(Number(req.body.stockQuantity)) || Number(req.body.stockQuantity) < 0)) {
            return res.status(400).json({ success: false, message: "Stock quantity cannot be negative" });
        }

        if (req.body.sector !== undefined && !["", "Livestock", "Aquaculture", "Fisheries"].includes(req.body.sector)) {
            return res.status(400).json({ success: false, message: "Choose a valid product sector" });
        }
        if (req.body.availability !== undefined && !["", "Available", "Pre-order", "Seasonal", "Out of stock"].includes(req.body.availability)) {
            return res.status(400).json({ success: false, message: "Choose a valid availability status" });
        }

        if (req.body.images !== undefined && (!Array.isArray(req.body.images) || req.body.images.some((image) => typeof image !== "string" || !/^https?:\/\//i.test(image)))) {
            return res.status(400).json({ success: false, message: "Images must be valid HTTP or HTTPS URLs" });
        }

        if (req.body.media !== undefined && (!Array.isArray(req.body.media) || req.body.media.length > 10 || req.body.media.some((item) => !item || !["image", "video"].includes(item.type) || typeof item.url !== "string" || !/^https?:\/\//i.test(item.url)))) {
            return res.status(400).json({ success: false, message: "Media must contain up to 10 valid image or video URLs" });
        }

        const resolvedCategory = req.body.category !== undefined ? req.body.category : product.category;
        const resolvedSubcategory = req.body.subcategory !== undefined ? req.body.subcategory : product.subcategory;

        if (!validSubcategoryForCategory(resolvedCategory, resolvedSubcategory)) {
            return res.status(400).json({ success: false, message: "Choose a product type that belongs to the selected category" });
        }

        const fields = [
            "name",
            "description",
            "price",
            "category",
            "subcategory",
            "unitOfMeasure",
            "stockQuantity",
            "images",
            "media",
            "isAvailable",
            "originLocation",
            "species",
            "condition",
            "productionMethod",
            "weightRange",
            "sector",
            "availability"
        ];

        for (const field of fields) {
            if (req.body[field] !== undefined) {
                if (["name", "species", "weightRange"].includes(field)) {
                    product[field] = req.body[field].trim();
                } else {
                    product[field] = req.body[field];
                }
            }
        }

        if (req.body.media !== undefined && req.body.images === undefined) {
            product.images = req.body.media.filter((item) => item.type === "image").map((item) => item.url);
        }

        if (req.auth.role !== "admin" && ["name", "price", "category", "images", "media"].some((field) => req.body[field] !== undefined)) {
            product.status = "pending";
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        return next(error);
    }
};

export const getVendorMediaUploadSignature = async(req, res, next) => {
    try {
        if (!req.auth || req.auth.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Use the Elevoni catalogue media workflow for house products"
            });
        }

        const profile = await profileForUser(currentUserId(req));

        if (!profile || profile.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "An approved vendor profile is required"
            });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            return res.status(503).json({
                success: false,
                message: "Media uploads are not configured"
            });
        }

        const { v2: cloudinary } = await
        import ("cloudinary");

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret
        });

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "elevoni/vendor-products";

        const signature = cloudinary.utils.api_sign_request({
            timestamp,
            folder
        }, apiSecret);

        return res.status(200).json({
            success: true,
            data: {
                cloudName,
                apiKey,
                timestamp,
                folder,
                signature
            }
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteVendorProduct = async(req, res, next) => {
    try {
        if (!validObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (req.auth.role !== "admin") {
            const profile = await profileForUser(currentUserId(req));

            if (!profile || profile.status !== "approved" || String(product.vendorId) !== String(profile._id)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You do not own this product listing."
                });
            }
        }

        await Product.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Product listing deleted successfully"
        });
    } catch (error) {
        return next(error);
    }
};

export const adminGetAllProducts = async(req, res, next) => {
    try {
        const filter = { category: { $in: ACTIVE_MARKETPLACE_CATEGORIES } };

        if (req.query.status) {
            if (!["pending", "approved", "rejected"].includes(req.query.status)) {
                return res.status(400).json({ success: false, message: "Invalid product status" });
            }

            filter.status = req.query.status;
        }

        const products = await Product.find(filter)
            .populate("vendorId", "businessName contactName email phone location state lga farmAddress status")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        return next(error);
    }
};

export const adminModerateProduct = async(req, res, next) => {
    try {
        if (!validObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const { status, rejectionReason, isFeatured } = req.body || {};

        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved, rejected, or pending"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (status === "approved") {
            if (!product.vendorId) {
                return res.status(409).json({
                    success: false,
                    message: "This listing is not linked to a vendor profile and cannot be published in the marketplace"
                });
            }

            const vendor = await vendorProfileModel.findById(product.vendorId);

            if (!vendor || vendor.status !== "approved") {
                return res.status(409).json({
                    success: false,
                    message: "Approve the vendor application before approving its products"
                });
            }
        }

        product.status = status;

        if (rejectionReason !== undefined) {
            product.rejectionReason = String(rejectionReason).slice(0, 500);
        }

        if (isFeatured !== undefined) {
            product.isFeatured = Boolean(isFeatured);
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: `Product status updated to '${status}'`,
            data: product
        });
    } catch (error) {
        return next(error);
    }
};

export const uploadVendorMedia = async(req, res, next) => {
    try {
        if (!req.auth || req.auth.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Use the Elevoni catalogue media workflow for house products"
            });
        }

        const profile = await profileForUser(currentUserId(req));

        if (!profile || profile.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "An approved vendor profile is required"
            });
        }

        const files = Array.isArray(req.files) ? req.files : [];

        if (!files.length) {
            return res.status(400).json({
                success: false,
                message: "Choose at least one image or video to upload"
            });
        }

        if (files.length > 10) {
            return res.status(400).json({
                success: false,
                message: "Upload no more than 10 media files at a time"
            });
        }

        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(503).json({
                success: false,
                message: "Media uploads are not configured. Please contact Elevoni support."
            });
        }

        const { v2: cloudinary } = await
        import ("cloudinary");

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const uploaded = [];

        for (const file of files) {
            const isImage = typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
            const isVideo = typeof file.mimetype === "string" && file.mimetype.startsWith("video/");
            const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

            if (!isImage && !isVideo) {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported media type for ${file.originalname || "file"}`
                });
            }

            if (Number(file.size) > maxBytes) {
                return res.status(413).json({
                    success: false,
                    message: `${file.originalname || "File"} exceeds the ${isVideo ? "50 MB video" : "10 MB image"} limit`
                });
            }

            const result = await cloudinary.uploader.upload(file.path, {
                folder: "elevoni/vendor-products",
                resource_type: isVideo ? "video" : "image",
                allowed_formats: isImage ? ["jpg", "jpeg", "png", "webp", "avif"] : ["mp4", "webm", "mov"],
                ...(isVideo ? { chunk_size: 6000000 } : {})
            });

            uploaded.push({
                url: result.secure_url,
                type: isVideo ? "video" : "image",
                publicId: result.public_id,
                alt: ""
            });
        }

        return res.status(201).json({ success: true, data: uploaded });
    } catch (error) {
        return next(error);
    } finally {
        await Promise.all((req.files || []).map((file) => {
            if (file.path) {
                return unlink(file.path).catch(() => {});
            }

            return Promise.resolve();
        }));
    }
};
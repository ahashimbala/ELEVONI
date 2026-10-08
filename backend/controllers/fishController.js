import fishModel from "../models/fishModel.js";
import { v2 as cloudinary } from "cloudinary";
import { parsePricingTiers, validateProductPricing } from "../services/productPricing.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const pricingModeOf = (explicit, tiers) => {
    if (explicit === "single" || explicit === "tiered") return explicit;
    return tiers.length > 0 ? "tiered" : "single";
};

const addFish = async(req, res) => {
    try {
        const pricingTiers = parsePricingTiers(req.body.pricingTiers || "[]");
        const price = Number(req.body.price);
        const pricingMode = pricingModeOf(req.body.pricingMode, pricingTiers);
        const validationError = validateProductPricing({ pricingMode, price, pricingTiers });
        if (validationError) return res.status(400).json({ success: false, message: validationError });
        let imageUrl = "";
        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "fish_store",
                resource_type: "auto"
            });
            imageUrl = uploadResult.secure_url;
        }
        const fish = new fishModel({
            name: req.body.name,
            description: req.body.description,
            price,
            category: req.body.category,
            image: imageUrl,
            media: [],
            pricingMode,
            pricingTiers
        });
        await fish.save();
        return res.status(201).json({ success: true, message: "Product created", id: fish._id });
    } catch (error) {
        console.log("addFish error:", error);
        return res.status(400).json({ success: false, message: error.message || "Error creating product" });
    }
};

const updateFish = async(req, res) => {
    try {
        const fish = await fishModel.findById(req.params.id);
        if (!fish) return res.status(404).json({ success: false, message: "Product not found" });
        const pricingTiers = req.body.pricingTiers === undefined
            ? fish.pricingTiers.map(({ minQuantity, maxQuantity, unitPrice }) => ({ minQuantity, maxQuantity, unitPrice }))
            : parsePricingTiers(req.body.pricingTiers);
        const pricingMode = pricingModeOf(req.body.pricingMode, pricingTiers);
        const nextProduct = {
            name: req.body.name ?? fish.name,
            description: req.body.description ?? fish.description,
            price: req.body.price === undefined ? fish.price : Number(req.body.price),
            category: req.body.category ?? fish.category,
            pricingMode,
            pricingTiers
        };
        const validationError = validateProductPricing(nextProduct);
        if (validationError) return res.status(400).json({ success: false, message: validationError });
        Object.assign(fish, nextProduct);
        await fish.save();
        return res.json({ success: true, message: "Product updated", data: fish });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || "Error updating product" });
    }
};

const listFish = async(req, res) => {
    try {
        const fish = await fishModel.find({ name: { $regex: "^Smoked\\s+Catfish(?:\\b|$)", $options: "i" } });
        res.json({ success: true, data: fish });
    } catch (error) {
        console.log("listFish error:", error);
        res.json({ success: false, message: "Error fetching products" });
    }
};

const listAllFish = async(req, res) => {
    try {
        const fish = await fishModel.find({});
        return res.json({ success: true, data: fish });
    } catch (error) {
        console.log("listAllFish error:", error);
        return res.status(500).json({ success: false, message: "Error fetching products" });
    }
};

const removeFish = async(req, res) => {
    try {
        const fish = await fishModel.findById(req.body.id);
        if (!fish) return res.json({ success: false, message: "Product not found" });
        if (fish.image) {
            const imagePublicId = fish.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy("fish_store/" + imagePublicId).catch(err => console.log("Cloudinary image delete error:", err));
        }
        if (fish.media && fish.media.length > 0) {
            const deletePromises = fish.media.map(url => {
                const mediaPublicId = url.split("/").pop().split(".")[0];
                const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                return cloudinary.uploader.destroy("fish_store/" + mediaPublicId, isVideo ? { resource_type: "video" } : {});
            });
            await Promise.all(deletePromises).catch(err => console.log("Cloudinary media delete error:", err));
        }
        await fishModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.log("removeFish error:", error);
        res.json({ success: false, message: "Error deleting product" });
    }
};

const addFishMedia = async(req, res) => {
    try {
        const { id } = req.body;
        if (!req.files || req.files.length === 0) {
            return res.json({ success: false, message: "No media uploaded" });
        }
        const uploadPromises = req.files.map(file =>
            cloudinary.uploader.upload(file.path, { folder: "fish_store", resource_type: "auto" })
        );
        const uploadResults = await Promise.all(uploadPromises);
        const mediaUrls = uploadResults.map(result => result.secure_url);
        await fishModel.findByIdAndUpdate(id, { $push: { media: { $each: mediaUrls } } });
        res.json({ success: true, message: "Media uploaded successfully" });
    } catch (error) {
        console.log("addFishMedia error:", error);
        res.json({ success: false, message: "Error uploading media" });
    }
};

export { addFish, updateFish, listFish, listAllFish, removeFish, addFishMedia };

import fishModel from "../models/fishModel.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const addFish = async(req, res) => {
    try {
        let imageUrl = "";

        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "fish_store"
            });
            imageUrl = uploadResult.secure_url;
        }

        const fish = new fishModel({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: imageUrl,
            media: []
        });

        await fish.save();

        res.json({
            success: true,
            message: "Product created",
            id: fish._id
        });
    } catch (error) {
        console.log("addFish error:", error);
        res.json({ success: false, message: "Error creating product" });
    }
};

const listFish = async(req, res) => {
    try {
        const fish = await fishModel.find({});
        res.json({ success: true, data: fish });
    } catch (error) {
        console.log("listFish error:", error);
        res.json({ success: false, message: "Error fetching products" });
    }
};

const removeFish = async(req, res) => {
    try {
        const fish = await fishModel.findById(req.body.id);

        if (!fish) {
            return res.json({ success: false, message: "Product not found" });
        }

        if (fish.image) {
            const imagePublicId = fish.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`fish_store/${imagePublicId}`).catch(err => console.log("Cloudinary image delete error:", err));
        }

        if (fish.media && fish.media.length > 0) {
            const deletePromises = fish.media.map(url => {
                const mediaPublicId = url.split("/").pop().split(".")[0];
                return cloudinary.uploader.destroy(`fish_store/${mediaPublicId}`);
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
            return res.json({
                success: false,
                message: "No media uploaded"
            });
        }

        const uploadPromises = req.files.map(file =>
            cloudinary.uploader.upload(file.path, { folder: "fish_store" })
        );

        const uploadResults = await Promise.all(uploadPromises);
        const mediaUrls = uploadResults.map(result => result.secure_url);

        await fishModel.findByIdAndUpdate(id, {
            $push: { media: { $each: mediaUrls } }
        });

        res.json({
            success: true,
            message: "Media uploaded successfully"
        });

    } catch (error) {
        console.log("addFishMedia error:", error);
        res.json({ success: false, message: "Error uploading media" });
    }
};

export {
    addFish,
    listFish,
    removeFish,
    addFishMedia
};
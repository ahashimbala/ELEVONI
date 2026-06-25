import fishModel from "../models/fishModel.js";
import fs from "fs";

const addFish = async(req, res) => {
    try {
        const image_filename = req.file ? req.file.filename : "";

        const fish = new fishModel({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: image_filename,
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
        const fish = await fishModel.findByIdAndDelete(req.body.id);

        if (fish) {
            if (fish.image) {
                fs.unlink(`uploads/${fish.image}`, () => {});
            }

            if (fish.media && fish.media.length > 0) {
                fish.media.forEach(file => {
                    fs.unlink(`uploads/${file}`, () => {});
                });
            }
        }

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

        const files = req.files.map(file => file.filename);

        await fishModel.findByIdAndUpdate(id, {
            $push: { media: { $each: files } }
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
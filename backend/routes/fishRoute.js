import express from "express";
import multer from "multer";
import {
    addFish,
    listFish,
    removeFish,
    addFishMedia
} from "../controllers/fishController.js";

const fishRouter = express.Router();

const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

fishRouter.post("/add", upload.single("image"), addFish);

fishRouter.get("/list", listFish);

fishRouter.post("/remove", removeFish);

fishRouter.post("/add-media", upload.array("media", 10), addFishMedia);

export default fishRouter;
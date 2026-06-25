import express from "express";
import multer from "multer";
import { addFish, listFish, removeFish, addFishMedia } from "../controllers/fishController.js";

const fishRouter = express.Router();

const storage = multer.diskStorage({});
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});

fishRouter.post("/add", upload.single("image"), addFish);
fishRouter.get("/list", listFish);
fishRouter.post("/remove", removeFish);
fishRouter.post("/add-media", upload.array("media", 10), addFishMedia);

export default fishRouter;
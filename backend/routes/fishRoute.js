import express from "express";
import multer from "multer";
import { addFish, updateFish, listFish, listAllFish, removeFish, addFishMedia } from "../controllers/fishController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const fishRouter = express.Router();
const storage = multer.diskStorage({});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

fishRouter.post("/add", authMiddleware, requireRole("admin"), upload.single("image"), addFish);
fishRouter.get("/list", listFish);
fishRouter.get("/admin-list", authMiddleware, requireRole("admin"), listAllFish);
fishRouter.put("/:id", authMiddleware, requireRole("admin"), updateFish);
fishRouter.post("/remove", authMiddleware, requireRole("admin"), removeFish);
fishRouter.post("/add-media", authMiddleware, requireRole("admin"), upload.array("media", 10), addFishMedia);

export default fishRouter;
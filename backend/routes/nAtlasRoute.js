import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import requireApprovedVendorProfile from "../middleware/vendor.js";
import { postNAtlasMessage, postNAtlasTranscription, postNAtlasSpeech } from "../controllers/nAtlasController.js";
import { prepareNAtlasIdentity } from "../middleware/natlasUsage.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = /^audio\//i.test(file.mimetype) || file.mimetype === "application/octet-stream";
    callback(null, allowed);
  },
});

// Approved vendor accounts use their stable vendor profile ID for the shared N-ATLaS cap.
router.use(verifyToken, requireApprovedVendorProfile());
router.post("/chat", prepareNAtlasIdentity, postNAtlasMessage);
router.post("/speech", postNAtlasSpeech);
router.post("/transcribe", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ success: false, message: status === 413 ? "Recording exceeds the 12 MB limit. Please record a shorter message." : "The audio upload could not be processed." });
    }
    return next(error);
  });
}, postNAtlasTranscription);
export default router;

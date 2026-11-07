import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import requireApprovedVendorProfile from "../middleware/vendor.js";
import { postNAtlasMessage, postNAtlasTranscription, postNAtlasSpeech } from "../controllers/nAtlasController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = /^audio\//i.test(file.mimetype) || file.mimetype === "application/octet-stream";
    callback(null, allowed);
  },
});

// Explicit opt-in keeps this private demo integration disabled by default.
router.use((req, res, next) => {
  if (process.env.NATLAS_DEMO_ENABLED !== "true") {
    return res.status(503).json({ success: false, message: "N-ATLaS demo access is disabled. Enable it only in the private development environment." });
  }
  return next();
});
router.use(verifyToken, requireApprovedVendorProfile());
router.post("/chat", postNAtlasMessage);
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

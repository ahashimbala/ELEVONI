import express from "express";
import multer from "multer";
import { postCustomerElevoniAssistantMessage, postCustomerElevoniAssistantTranscription, postCustomerElevoniAssistantSpeech } from "../controllers/nAtlasCustomerController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, /^audio\//i.test(file.mimetype) || file.mimetype === "application/octet-stream"),
});

// Public storefront access is enabled; short-window request throttling protects the API from abuse.
router.use(optionalAuth);
router.post("/chat", postCustomerElevoniAssistantMessage);
router.post("/speech", postCustomerElevoniAssistantSpeech);
router.post("/transcribe", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ success: false, message: status === 413 ? "That recording is too large. Please record a shorter message." : "The voice recording could not be processed." });
    }
    return next(error);
  });
}, postCustomerElevoniAssistantTranscription);

export default router;

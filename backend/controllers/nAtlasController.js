import { answerNAtlas, transcribeNAtlas, speakNAtlas, ALLOWED_LANGUAGES } from "../services/nAtlasIntelligence.js";

const requestBuckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function allowRequest(key) {
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestBuckets.set(key, { startedAt: now, count: 1 });
    if (requestBuckets.size > 5000) {
      for (const [bucketKey, bucket] of requestBuckets) if (now - bucket.startedAt >= WINDOW_MS) requestBuckets.delete(bucketKey);
    }
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

export async function postNAtlasMessage(req, res, next) {
  try {
    const vendorId = req.vendor?.profileId;
    if (!vendorId) return res.status(403).json({ success: false, message: "An approved vendor profile is required to use N-ATLAS." });
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message || message.length > 1500) return res.status(400).json({ success: false, message: "Enter a message of 1–1500 characters." });
    if (!ALLOWED_LANGUAGES.has(language)) return res.status(400).json({ success: false, message: "Choose one of N-ATLAS's supported languages." });
    if (history.length > 10 || history.some((item) => !item || !["user", "assistant"].includes(item.role) || typeof item.text !== "string" || item.text.length > 1500)) {
      return res.status(400).json({ success: false, message: "Conversation history is invalid. Start a new conversation and try again." });
    }
    if (!allowRequest(String(vendorId))) return res.status(429).json({ success: false, message: "You've sent several requests in a short time. Please wait a minute and try again." });

    const result = await answerNAtlas({ vendorId, message, history, language });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.status && error.status < 500) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    if (error.status === 503) return res.status(503).json({ success: false, message: error.message, code: error.code });
    return next(error);
  }
}


export async function postNAtlasTranscription(req, res, next) {
  try {
    const vendorId = req.vendor?.profileId;
    if (!vendorId) return res.status(403).json({ success: false, message: "An approved vendor profile is required to use N-ATLAS." });
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    if (!ALLOWED_LANGUAGES.has(language)) return res.status(400).json({ success: false, message: "Choose one of N-ATLAS's supported languages." });
    if (!req.file?.buffer?.length) return res.status(400).json({ success: false, message: "Record a voice message before transcribing." });
    if (!allowRequest(`${vendorId}:asr`)) return res.status(429).json({ success: false, message: "You've sent several voice requests in a short time. Please wait a minute and try again." });
    const result = await transcribeNAtlas({ audio: req.file.buffer, filename: req.file.originalname || "voice.webm", language });
    if (!result.text) return res.status(422).json({ success: false, message: "No speech was detected. Please try again in a quieter place." });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.status && error.status < 500) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    if (error.status === 503) return res.status(503).json({ success: false, message: error.message, code: error.code });
    return next(error);
  }
}


export async function postNAtlasSpeech(req, res, next) {
  try {
    const vendorId = req.vendor?.profileId;
    if (!vendorId) return res.status(403).json({ success: false, message: "An approved vendor profile is required to use N-ATLAS." });
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    if (!text || text.length > 800) return res.status(400).json({ success: false, message: "Speech text must contain 1–800 characters." });
    if (!ALLOWED_LANGUAGES.has(language)) return res.status(400).json({ success: false, message: "Choose one of N-ATLAS's supported languages." });
    if (!allowRequest(`${vendorId}:tts`)) return res.status(429).json({ success: false, message: "You've sent several voice requests in a short time. Please wait a minute and try again." });
    const result = await speakNAtlas({ text, language });
    res.setHeader("Content-Type", result.contentType || "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    if (result.voice) res.setHeader("X-Natlas-Voice", result.voice);
    if (result.note) res.setHeader("X-Natlas-Voice-Note", result.note);
    return res.status(200).send(result.audio);
  } catch (error) {
    if (error.status && error.status < 500) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    if (error.status === 501 || error.status === 503) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    return next(error);
  }
}

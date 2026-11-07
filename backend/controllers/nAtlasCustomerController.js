import { randomUUID } from "node:crypto";
import { createClientAbortContext } from "../utils/clientAbort.js";
import { ALLOWED_LANGUAGES } from "../services/nAtlasIntelligence.js";
import { transcribeElevenLabs, speakElevenLabs } from "../services/elevenLabsVoice.js";
import { admitNAtlasRequest } from "../middleware/natlasUsage.js";
import { answerCustomerElevoniAssistant } from "../services/nAtlasCustomer.js";

const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_CHAT = 12;
const MAX_TRANSCRIPTIONS = 5;

function allowRequest(key, limit) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    if (buckets.size > 6000) {
      for (const [id, item] of buckets) if (now - item.startedAt >= WINDOW_MS) buckets.delete(id);
    }
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

const clientKey = (req) => String(req.ip || req.socket?.remoteAddress || "unknown").slice(0, 100);
const requestId = (res) => { const id = randomUUID(); res.setHeader("X-Request-ID", id); return id; };

function sendError(error, req, res, next, signal) {
  if (signal?.aborted || res.destroyed || res.writableEnded || error?.status === 499) return;
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ success: false, message: error.message, code: error.code || "ELEVONI_ASSISTANT_REQUEST_ERROR" });
  }
  if (error?.status === 502 || error?.status === 503 || error?.status === 504) {
    return res.status(error.status).json({ success: false, message: error.message, code: error.code || "ELEVONI_ASSISTANT_UNAVAILABLE" });
  }
  return next(error);
}

export async function postCustomerElevoniAssistantMessage(req, res, next) {
  requestId(res);
  const abort = createClientAbortContext(req, res);
  try {
    const key = `${clientKey(req)}:chat`;
    if (!allowRequest(key, MAX_CHAT)) return res.status(429).json({ success: false, message: "Please wait a little before sending another message." });
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!message || message.length > 1200) return res.status(400).json({ success: false, message: "Enter a message of 1–1,200 characters." });
    if (!ALLOWED_LANGUAGES.has(language)) return res.status(400).json({ success: false, message: "Choose a supported language." });
    if (history.length > 8 || history.some((item) => !item || !["user", "assistant"].includes(item.role) || typeof item.text !== "string" || item.text.length > 700)) {
      return res.status(400).json({ success: false, message: "Conversation history is too long. Start a new chat and try again." });
    }
    req.natlasService = "customer-chat";
    if (!await admitNAtlasRequest(req, res)) return;
    const result = await answerCustomerElevoniAssistant({ message, language, history, abortSignal: abort.signal, requestId: res.getHeader("X-Request-ID") });
    if (abort.signal.aborted || res.destroyed) return;
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return sendError(error, req, res, next, abort.signal);
  } finally { abort.cleanup(); }
}

export async function postCustomerElevoniAssistantTranscription(req, res, next) {
  requestId(res);
  const abort = createClientAbortContext(req, res);
  try {
    const key = `${clientKey(req)}:asr`;
    if (!allowRequest(key, MAX_TRANSCRIPTIONS)) return res.status(429).json({ success: false, message: "Please wait before sending another voice recording." });
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    if (!ALLOWED_LANGUAGES.has(language)) return res.status(400).json({ success: false, message: "Choose a supported language." });
    if (!req.file?.buffer?.length) return res.status(400).json({ success: false, message: "Record a voice message before sending." });
    const result = await transcribeElevenLabs({ audio: req.file.buffer, filename: req.file.originalname || "elevoni-assistant-voice.webm", mimeType: req.file.mimetype, language, abortSignal: abort.signal });
    if (abort.signal.aborted || res.destroyed) return;
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return sendError(error, req, res, next, abort.signal);
  } finally { abort.cleanup(); }
}


export async function postCustomerElevoniAssistantSpeech(req, res, next) {
  requestId(res);
  const abort = createClientAbortContext(req, res);
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    if (!text || text.length > 800) return res.status(400).json({ success: false, message: "Speech text must contain 1–800 characters." });
    if (!ALLOWED_LANGUAGES.has(language)) return res.status(400).json({ success: false, message: "Choose a supported language." });
    const key = `${clientKey(req)}:tts`;
    if (!allowRequest(key, MAX_CHAT)) return res.status(429).json({ success: false, message: "Please wait before requesting another voice message." });
    const result = await speakElevenLabs({ text, language, abortSignal: abort.signal });
    if (abort.signal.aborted || res.destroyed) return;
    res.setHeader("Content-Type", result.contentType || "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    if (result.voice) res.setHeader("X-Elevoni-Voice", result.voice);
    if (result.note) res.setHeader("X-Elevoni-Voice-Note", result.note);
    return res.status(200).send(result.audio);
  } catch (error) {
    return sendError(error, req, res, next, abort.signal);
  } finally { abort.cleanup(); }
}

import { randomUUID } from "node:crypto";
import { createClientAbortContext } from "../utils/clientAbort.js";
import {
  answerNAtlas,
  ALLOWED_LANGUAGES,
} from "../services/nAtlasIntelligence.js";
import { speakElevenLabs } from "../services/elevenLabsVoice.js";
import { transcribeOpenAI } from "../services/openaiApi.js";
import { checkAssistantDailyQuota, consumeAssistantPrompt, sendAssistantDailyLimit } from "../services/assistantDailyLimit.js";

const requestBuckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function allowRequest(key) {
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestBuckets.set(key, { startedAt: now, count: 1 });
    if (requestBuckets.size > 5000) {
      for (const [bucketKey, bucket] of requestBuckets) {
        if (now - bucket.startedAt >= WINDOW_MS) requestBuckets.delete(bucketKey);
      }
    }
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

function beginRequest(res) {
  const requestId = randomUUID();
  res.setHeader("X-Request-ID", requestId);
  return requestId;
}

function handleRequestError(error, res, next, abortSignal) {
  if (abortSignal?.aborted || res.destroyed || res.writableEnded) return;
  if (error?.status === 499) return;
  if (error?.status && error.status < 500) {
    return res.status(error.status).json({ success: false, message: error.message, code: error.code });
  }
  if (error?.status === 502 || error?.status === 503 || error?.status === 504) {
    return res.status(error.status).json({ success: false, message: error.message, code: error.code });
  }
  return next(error);
}

export async function postNAtlasMessage(req, res, next) {
  const requestId = beginRequest(res);
  const clientAbort = createClientAbortContext(req, res);
  try {
    const vendorId = req.vendor?.profileId;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: "An approved vendor profile is required to use Elevoni Assistant." });
    }

    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message || message.length > 1500) {
      return res.status(400).json({ success: false, message: "Enter a message of 1–1500 characters." });
    }
    if (!ALLOWED_LANGUAGES.has(language)) {
      return res.status(400).json({ success: false, message: "Choose one of Elevoni Assistant's supported languages." });
    }
    if (history.length > 10 || history.some((item) => (
      !item || !["user", "assistant"].includes(item.role)
      || typeof item.text !== "string" || item.text.length > 1500
    ))) {
      return res.status(400).json({ success: false, message: "Conversation history is invalid. Start a new conversation and try again." });
    }
    if (!allowRequest(String(vendorId))) {
      return res.status(429).json({ success: false, message: "You've sent several requests in a short time. Please wait a minute and try again." });
    }
    const dailyQuota = await consumeAssistantPrompt(req, "vendor");
    if (!dailyQuota.allowed) return sendAssistantDailyLimit(res, dailyQuota);

    const result = await answerNAtlas({
      vendorId,
      message,
      history,
      language,
      abortSignal: clientAbort.signal,
      requestId,
    });
    if (clientAbort.signal.aborted || res.destroyed) return;
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleRequestError(error, res, next, clientAbort.signal);
  } finally {
    clientAbort.cleanup();
  }
}

export async function postNAtlasTranscription(req, res, next) {
  const clientAbort = createClientAbortContext(req, res);
  try {
    const vendorId = req.vendor?.profileId;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: "An approved vendor profile is required to use Elevoni Assistant." });
    }

    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    if (!ALLOWED_LANGUAGES.has(language)) {
      return res.status(400).json({ success: false, message: "Choose one of Elevoni Assistant's supported languages." });
    }
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: "Record a voice message before transcribing." });
    }
    const dailyQuota = await checkAssistantDailyQuota(req);
    if (!dailyQuota.allowed) return sendAssistantDailyLimit(res, dailyQuota);
    if (!allowRequest(`${vendorId}:asr`)) {
      return res.status(429).json({ success: false, message: "You've sent several voice requests in a short time. Please wait a minute and try again." });
    }

    const result = await transcribeOpenAI({
      audio: req.file.buffer,
      filename: req.file.originalname || "elevoni-assistant-voice.webm",
      mimeType: req.file.mimetype,
      language,
      abortSignal: clientAbort.signal,
    });
    if (clientAbort.signal.aborted || res.destroyed) return;
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleRequestError(error, res, next, clientAbort.signal);
  } finally {
    clientAbort.cleanup();
  }
}

export async function postNAtlasSpeech(req, res, next) {
  const clientAbort = createClientAbortContext(req, res);
  try {
    const vendorId = req.vendor?.profileId;
    if (!vendorId) {
      return res.status(403).json({ success: false, message: "An approved vendor profile is required to use Elevoni Assistant." });
    }
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const language = typeof req.body?.language === "string" ? req.body.language : "en-NG";
    if (!text || text.length > 800) {
      return res.status(400).json({ success: false, message: "Speech text must contain 1–800 characters." });
    }
    if (!ALLOWED_LANGUAGES.has(language)) {
      return res.status(400).json({ success: false, message: "Choose one of Elevoni Assistant's supported languages." });
    }
    if (!allowRequest(`${vendorId}:tts`)) {
      return res.status(429).json({ success: false, message: "You've sent several voice requests in a short time. Please wait a minute and try again." });
    }

    const result = await speakElevenLabs({ text, language, abortSignal: clientAbort.signal });
    if (clientAbort.signal.aborted || res.destroyed) return;
    res.setHeader("Content-Type", result.contentType || "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    if (result.voice) res.setHeader("X-Elevoni-Voice", result.voice);
    if (result.provider) res.setHeader("X-Elevoni-Voice-Provider", result.provider);
    if (result.note) res.setHeader("X-Elevoni-Voice-Note", result.note);
    return res.status(200).send(result.audio);
  } catch (error) {
    return handleRequestError(error, res, next, clientAbort.signal);
  } finally {
    clientAbort.cleanup();
  }
}

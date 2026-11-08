const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_TRANSCRIPT_CHARS = 5_000;

const STT_LANGUAGE_CODES = Object.freeze({
  "en-NG": "eng",
  "pcm-NG": "eng", // Pidgin is approximated with Nigerian English recognition.
  "ha-NG": "hau",
  "ig-NG": "ibo",
  "yo-NG": "yor",
});

const TTS_LANGUAGE_CONFIG = Object.freeze({
  "en-NG": { languageCode: "en", env: "ELEVENLABS_ENGLISH_VOICE_ID", label: "Nigerian English" },
  "pcm-NG": { languageCode: "en", env: "ELEVENLABS_PIDGIN_VOICE_ID", label: "Nigerian Pidgin" },
  "ha-NG": { languageCode: "ha", env: "ELEVENLABS_HAUSA_VOICE_ID", label: "Hausa" },
  "yo-NG": { languageCode: "yo", env: "ELEVENLABS_YORUBA_VOICE_ID", label: "Yoruba" },
  "ig-NG": { languageCode: "ig", env: "ELEVENLABS_IGBO_VOICE_ID", label: "Igbo" },
});

function providerError(message, status, code, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.status = status;
  error.code = code;
  return error;
}

function getApiKey(env = process.env) {
  const key = String(env.ELEVENLABS_API_KEY || "").trim();
  if (!key) throw providerError("Cloud voice is not configured yet. Add ELEVENLABS_API_KEY to the backend environment.", 503, "ELEVENLABS_NOT_CONFIGURED");
  return key;
}

function requestSignal(abortSignal) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return abortSignal ? AbortSignal.any([abortSignal, timeout]) : timeout;
}

function mapFetchError(error, abortSignal, operation) {
  if (abortSignal?.aborted || error?.name === "AbortError") {
    return providerError(`ElevenLabs ${operation} was cancelled.`, 499, "ELEVENLABS_REQUEST_CANCELLED", error);
  }
  if (error?.name === "TimeoutError") {
    return providerError(`ElevenLabs ${operation} timed out. Please try again.`, 504, "ELEVENLABS_TIMEOUT", error);
  }
  return providerError(`ElevenLabs ${operation} could not be reached. Please try again.`, 502, "ELEVENLABS_UNREACHABLE", error);
}

async function readProviderError(response, operation) {
  const body = await response.text().catch(() => "");
  let detail = "";
  try {
    const parsed = JSON.parse(body);
    detail = parsed?.detail?.message || parsed?.detail || parsed?.message || "";
  } catch {
    detail = body;
  }
  const safeDetail = typeof detail === "string" ? detail.replace(/[\r\n\t]+/g, " ").slice(0, 240) : "";
  if (response.status === 401 || response.status === 403) {
    return providerError("ElevenLabs rejected the configured API key or its permissions. Check the backend API key and enabled permissions.", 503, "ELEVENLABS_AUTH_FAILED");
  }
  if (response.status === 429) {
    return providerError("ElevenLabs is rate-limiting requests. Please wait a moment and try again.", 429, "ELEVENLABS_RATE_LIMITED");
  }
  const status = response.status >= 500 ? 502 : 422;
  return providerError(`ElevenLabs ${operation} failed (${response.status}).${safeDetail ? ` ${safeDetail}` : ""}`, status, "ELEVENLABS_PROVIDER_ERROR");
}

/** Legacy direct ElevenLabs transcription helper. Live assistant transcription now uses OpenAI. */
export async function transcribeElevenLabs({ audio, filename = "voice.webm", mimeType = "audio/webm", language = "en-NG", abortSignal, env = process.env, fetchImpl = fetch }) {
  if (!Buffer.isBuffer(audio) || audio.length === 0) {
    throw providerError("The audio recording is empty or invalid.", 400, "VOICE_AUDIO_INVALID");
  }
  const languageCode = STT_LANGUAGE_CODES[language];
  if (!languageCode) throw providerError("Choose a supported language.", 400, "VOICE_LANGUAGE_UNSUPPORTED");
  const apiKey = getApiKey(env);
  const form = new FormData();
  const safeFilename = String(filename || "voice.webm").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "voice.webm";
  form.append("file", new Blob([audio], { type: mimeType || "application/octet-stream" }), safeFilename);
  form.append("model_id", String(env.ELEVENLABS_STT_MODEL || "scribe_v2"));
  form.append("language_code", languageCode);
  form.append("tag_audio_events", "false");

  let response;
  try {
    response = await fetchImpl(`${ELEVENLABS_API_BASE}/speech-to-text`, {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
      signal: requestSignal(abortSignal),
    });
  } catch (error) {
    throw mapFetchError(error, abortSignal, "transcription");
  }
  if (!response.ok) throw await readProviderError(response, "transcription");
  let result;
  try { result = await response.json(); }
  catch (error) { throw providerError("ElevenLabs returned an invalid transcription response.", 502, "ELEVENLABS_INVALID_RESPONSE", error); }
  const text = typeof result?.text === "string" ? result.text.trim().slice(0, MAX_TRANSCRIPT_CHARS) : "";
  if (!text) throw providerError("No clear speech was detected. Please try a shorter, clearer recording.", 422, "VOICE_NO_SPEECH");
  return {
    text,
    language: result.language_code || languageCode,
    languageProbability: Number.isFinite(result.language_probability) ? result.language_probability : null,
    provider: "elevenlabs",
    model: String(env.ELEVENLABS_STT_MODEL || "scribe_v2"),
    notice: language === "pcm-NG"
      ? "Pidgin transcription uses Nigerian English recognition and may miss Pidgin expressions. Please review the transcript before sending."
      : null,
  };
}

/** Cloud speech generation. Each configured language uses its own server-side voice ID. */
export async function speakElevenLabs({ text, language = "en-NG", abortSignal, env = process.env, fetchImpl = fetch }) {
  const spokenText = typeof text === "string" ? text.trim() : "";
  if (!spokenText || spokenText.length > 800) {
    throw providerError("Speech text must contain 1–800 characters.", 400, "VOICE_TEXT_INVALID");
  }
  const config = TTS_LANGUAGE_CONFIG[language];
  if (!config) {
    throw providerError("A dedicated cloud voice is not currently configured for this language. You can read the text response.", 422, "ELEVENLABS_VOICE_LANGUAGE_UNAVAILABLE");
  }
  const voiceId = String(env[config.env] || "").trim();
  if (!voiceId) {
    throw providerError(`The ${config.label} cloud voice has not been configured. Add ${config.env} to the backend environment.`, 503, "ELEVENLABS_VOICE_NOT_CONFIGURED");
  }
  const apiKey = getApiKey(env);
  const modelId = String(env.ELEVENLABS_TTS_MODEL || "eleven_v3").trim();
  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: spokenText, model_id: modelId, language_code: config.languageCode }),
      signal: requestSignal(abortSignal),
    });
  } catch (error) {
    throw mapFetchError(error, abortSignal, "speech generation");
  }
  if (!response.ok) throw await readProviderError(response, "speech generation");
  const contentType = response.headers.get("content-type") || "audio/mpeg";
  if (!contentType.toLowerCase().includes("audio/")) {
    throw providerError("ElevenLabs returned an unexpected speech response.", 502, "ELEVENLABS_INVALID_AUDIO");
  }
  let audio;
  try { audio = Buffer.from(await response.arrayBuffer()); }
  catch (error) { throw providerError("ElevenLabs audio could not be downloaded.", 502, "ELEVENLABS_AUDIO_DOWNLOAD_FAILED", error); }
  if (!audio.length) throw providerError("ElevenLabs returned an empty audio file.", 502, "ELEVENLABS_EMPTY_AUDIO");
  return {
    audio,
    contentType,
    voice: voiceId,
    provider: "elevenlabs",
    note: language === "pcm-NG"
      ? "Playing an English-language voice for Nigerian Pidgin. Pidgin pronunciation has not yet been validated."
      : `Playing the configured ElevenLabs ${config.label} cloud voice.`,
  };
}

export const ELEVENLABS_LANGUAGE_SUPPORT = Object.freeze({
  speechToText: [],
  textToSpeech: ["en-NG (dedicated voice ID required)", "ha-NG (dedicated voice ID required)", "yo-NG (dedicated voice ID required)", "ig-NG (dedicated voice ID required; validate native-speaker quality)", "pcm-NG (dedicated Pidgin voice ID required; no English-voice substitution)"],
});

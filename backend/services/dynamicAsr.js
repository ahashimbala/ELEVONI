function providerError(message, status = 502, code = "DYNAMIC_ASR_ERROR") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export async function transcribeDynamicASR({
  audio,
  filename = "voice.webm",
  mimeType = "audio/webm",
  language = "en-NG",
  abortSignal,
  env = process.env,
  fetchImpl = fetch,
}) {
  if (!Buffer.isBuffer(audio) || !audio.length) {
    throw providerError("The audio recording is empty or invalid.", 400, "ASR_AUDIO_INVALID");
  }
  if (audio.length > 12 * 1024 * 1024) {
    throw providerError("The recording exceeds the 12 MB limit. Please record a shorter message.", 413, "ASR_AUDIO_TOO_LARGE");
  }

  const endpoint = String(env.DYNAMIC_ASR_MODAL_URL || "").trim();
  const apiKey = String(env.DYNAMIC_ASR_MODAL_API_KEY || "").trim();
  if (!endpoint || !apiKey) {
    throw providerError(
      "Dynamic ASR is not configured. Set DYNAMIC_ASR_MODAL_URL and DYNAMIC_ASR_MODAL_API_KEY in the backend environment.",
      503,
      "DYNAMIC_ASR_NOT_CONFIGURED"
    );
  }

  const form = new FormData();
  const safeFilename = String(filename || "voice.webm").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "voice.webm";
  form.append("file", new Blob([audio], { type: mimeType || "application/octet-stream" }), safeFilename);

  let response;
  try {
    const timeout = AbortSignal.timeout(Number(env.DYNAMIC_ASR_TIMEOUT_MS) || 90_000);
    const signal = abortSignal ? AbortSignal.any([abortSignal, timeout]) : timeout;
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal,
    });
  } catch (error) {
    if (abortSignal?.aborted || error?.name === "AbortError") {
      throw providerError("Speech transcription was cancelled.", 499, "ASR_REQUEST_CANCELLED");
    }
    if (error?.name === "TimeoutError") {
      throw providerError("Speech transcription took too long. Please try again.", 504, "DYNAMIC_ASR_TIMEOUT");
    }
    throw providerError("Elevoni could not reach the Dynamic ASR service. Please try again.", 502, "DYNAMIC_ASR_UNREACHABLE");
  }

  let payload = {};
  try { payload = await response.json(); } catch { /* handled below */ }
  if (!response.ok || payload?.success !== true) {
    const status = response.status === 401 ? 503 : (response.status >= 500 ? 502 : response.status);
    throw providerError(
      response.status === 401
        ? "Dynamic ASR authentication failed. Check the Modal secret and backend API key configuration."
        : String(payload?.detail || payload?.message || "Dynamic ASR could not transcribe this recording.").slice(0, 220),
      status,
      response.status === 401 ? "DYNAMIC_ASR_AUTH_FAILED" : "DYNAMIC_ASR_PROVIDER_ERROR"
    );
  }

  const text = typeof payload.text === "string" ? payload.text.trim().slice(0, 5000) : "";
  if (!text) throw providerError("No clear speech was detected. Please try a shorter, clearer recording.", 422, "DYNAMIC_ASR_NO_SPEECH");

  return {
    text,
    language,
    provider: "dynamic-asr",
    model: payload.model || "dynamic-asr-pocket-300m-int8",
    selectedLanguage: language,
    durationSeconds: Number(payload.durationSeconds) || null,
    notice: "Please review names, locations, quantities and prices before sending. Speech recognition can make mistakes.",
  };
}

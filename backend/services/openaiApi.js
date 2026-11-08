
const OPENAI_API_BASE = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 45_000;

export const ELEVONI_LANGUAGES = Object.freeze({
  "en-NG": { name: "Nigerian English", transcription: "en", pidgin: false },
  "pcm-NG": { name: "Nigerian Pidgin", transcription: "en", pidgin: true },
  "ha-NG": { name: "Hausa", transcription: "ha", pidgin: false },
  "ig-NG": { name: "Igbo", transcription: "ig", pidgin: false },
  "yo-NG": { name: "Yoruba", transcription: "yo", pidgin: false },
});

export const ELEVONI_ALLOWED_LANGUAGES = new Set(
  Object.keys(ELEVONI_LANGUAGES)
);

function apiError(
  message,
  status = 502,
  code = "OPENAI_API_ERROR",
  cause
) {
  const error = new Error(
    message,
    cause ? { cause } : undefined
  );
  error.status = status;
  error.code = code;
  return error;
}

function getApiKey(env = process.env) {
  const key = String(env.OPENAI_API_KEY || "").trim();

  if (!key) {
    throw apiError(
      "OpenAI is not configured. Add OPENAI_API_KEY to the backend environment.",
      503,
      "OPENAI_NOT_CONFIGURED"
    );
  }

  return key;
}

function makeSignal(abortSignal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  return abortSignal
    ? AbortSignal.any([abortSignal, timeoutSignal])
    : timeoutSignal;
}

async function readError(response) {
  const body = await response.text().catch(() => "");
  let message = "";

  try {
    const parsed = JSON.parse(body);
    message = parsed?.error?.message || parsed?.message || "";
  } catch {
    message = body;
  }

  if (response.status === 401 || response.status === 403) {
    return apiError(
      "OpenAI rejected the backend API key or its permissions. Check the key and project access.",
      503,
      "OPENAI_AUTH_FAILED"
    );
  }

  if (response.status === 429) {
    return apiError(
      "OpenAI is rate-limiting requests or the project has reached its usage limit. Check billing and rate limits.",
      429,
      "OPENAI_RATE_LIMITED"
    );
  }

  if (response.status === 400) {
    return apiError(
      `OpenAI rejected the request: ${String(message || "invalid request").slice(0, 220)}`,
      422,
      "OPENAI_REQUEST_REJECTED"
    );
  }

  return apiError(
    `OpenAI request failed (${response.status}). ${String(message || "Please try again.").slice(0, 220)}`,
    response.status >= 500 ? 502 : 422,
    "OPENAI_PROVIDER_ERROR"
  );
}

function extractOutputText(payload) {
  if (
    typeof payload?.output_text === "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text.trim();
  }

  const chunks = [];

  for (const item of payload?.output || []) {
    if (item?.type === "message") {
      for (const content of item.content || []) {
        if (
          content?.type === "output_text" &&
          typeof content.text === "string"
        ) {
          chunks.push(content.text);
        }

        if (content?.type === "refusal") {
          throw apiError(
            "The assistant could not safely process that request. Please rephrase it.",
            422,
            "OPENAI_REFUSAL"
          );
        }
      }
    }
  }

  return chunks.join("\n").trim();
}

export async function createOpenAIResponse({
  instructions,
  input,
  schema,
  model,
  maxOutputTokens = 1000,
  reasoningEffort,
  abortSignal,
  env = process.env,
  fetchImpl = fetch,
}) {
  const apiKey = getApiKey(env);

  // Resolve the model once so all request settings use the same model.
  const selectedModel = String(
    model || env.OPENAI_MODEL || "gpt-4o-mini"
  ).trim();

  const body = {
    model: selectedModel,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
  };

  // GPT-4o mini does not support reasoning.effort.
  // Do not send the reasoning parameter to this model.
  const effort =
    reasoningEffort ||
    env.OPENAI_REASONING_EFFORT ||
    "low";

  if (
    selectedModel !== "gpt-4o-mini" &&
    effort &&
    effort !== "none"
  ) {
    body.reasoning = { effort };
  }

  if (schema) {
    body.text = {
      format: {
        type: "json_schema",
        name: schema.name,
        strict: true,
        schema: schema.schema,
      },
    };
  }

  let response;

  try {
    response = await fetchImpl(
      `${OPENAI_API_BASE}/responses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: makeSignal(
          abortSignal,
          Number(env.OPENAI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
        ),
      }
    );
  } catch (error) {
    if (abortSignal?.aborted || error?.name === "AbortError") {
      throw apiError(
        "The OpenAI request was cancelled.",
        499,
        "OPENAI_REQUEST_CANCELLED",
        error
      );
    }

    if (error?.name === "TimeoutError") {
      throw apiError(
        "OpenAI took too long to respond. Please try again.",
        504,
        "OPENAI_TIMEOUT",
        error
      );
    }

    throw apiError(
      "OpenAI could not be reached. Check the backend network connection and try again.",
      502,
      "OPENAI_UNREACHABLE",
      error
    );
  }

  if (!response.ok) {
    throw await readError(response);
  }

  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    throw apiError(
      "OpenAI returned an invalid response.",
      502,
      "OPENAI_INVALID_RESPONSE",
      error
    );
  }

  if (payload?.status === "incomplete") {
    throw apiError(
      "The assistant response was incomplete. Please try again.",
      502,
      "OPENAI_INCOMPLETE_RESPONSE"
    );
  }

  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw apiError(
      "OpenAI returned an empty response. Please try again.",
      502,
      "OPENAI_EMPTY_RESPONSE"
    );
  }

  let parsed = null;

  if (schema) {
    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      throw apiError(
        "OpenAI returned structured data that could not be parsed.",
        502,
        "OPENAI_INVALID_STRUCTURED_OUTPUT",
        error
      );
    }
  }

  return {
    text: outputText,
    parsed,
    model: payload?.model || body.model,
    responseId: payload?.id || null,
  };
}

export async function transcribeOpenAI({
  audio,
  filename = "voice.webm",
  mimeType = "audio/webm",
  language = "en-NG",
  abortSignal,
  env = process.env,
  fetchImpl = fetch,
}) {
  if (!Buffer.isBuffer(audio) || !audio.length) {
    throw apiError(
      "The audio recording is empty or invalid.",
      400,
      "OPENAI_AUDIO_INVALID"
    );
  }

  const languageConfig = ELEVONI_LANGUAGES[language];

  if (!languageConfig) {
    throw apiError(
      "Choose one of Elevoni Assistant's supported languages.",
      400,
      "OPENAI_LANGUAGE_UNSUPPORTED"
    );
  }

  if (audio.length > 24 * 1024 * 1024) {
    throw apiError(
      "The recording is too large. Please record a shorter message.",
      413,
      "OPENAI_AUDIO_TOO_LARGE"
    );
  }

  const form = new FormData();

  const safeFilename = String(
    filename || "voice.webm"
  )
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100) || "voice.webm";

  form.append(
    "file",
    new Blob([audio], {
      type: mimeType || "application/octet-stream",
    }),
    safeFilename
  );

  form.append(
    "model",
    env.OPENAI_TRANSCRIPTION_MODEL || "gpt-transcribe"
  );

  form.append(
    "languages[]",
    languageConfig.transcription
  );

  if (languageConfig.pidgin) {
    form.append(
      "prompt",
      "Transcribe the speaker's Nigerian Pidgin as spoken. Do not translate it into standard English. Preserve Pidgin vocabulary, Nigerian names, places, quantities and numbers. If the speaker naturally code-switches, preserve the words actually spoken."
    );
  } else if (language === "en-NG") {
    form.append(
      "prompt",
      "Transcribe the Nigerian English speech exactly as spoken. Preserve Nigerian names, agricultural product names, locations, quantities and numbers."
    );
  }

  form.append("response_format", "json");

  let response;

  try {
    response = await fetchImpl(
      `${OPENAI_API_BASE}/audio/transcriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getApiKey(env)}`,
        },
        body: form,
        signal: makeSignal(
          abortSignal,
          Number(env.OPENAI_TRANSCRIPTION_TIMEOUT_MS) || 90_000
        ),
      }
    );
  } catch (error) {
    if (abortSignal?.aborted || error?.name === "AbortError") {
      throw apiError(
        "The transcription request was cancelled.",
        499,
        "OPENAI_REQUEST_CANCELLED",
        error
      );
    }

    if (error?.name === "TimeoutError") {
      throw apiError(
        "Speech transcription took too long. Please try again.",
        504,
        "OPENAI_TRANSCRIPTION_TIMEOUT",
        error
      );
    }

    throw apiError(
      "OpenAI speech transcription could not be reached.",
      502,
      "OPENAI_TRANSCRIPTION_UNREACHABLE",
      error
    );
  }

  if (!response.ok) {
    throw await readError(response);
  }

  let result;

  try {
    result = await response.json();
  } catch (error) {
    throw apiError(
      "OpenAI returned an invalid transcription response.",
      502,
      "OPENAI_TRANSCRIPTION_INVALID_RESPONSE",
      error
    );
  }

  const text = typeof result?.text === "string"
    ? result.text.trim().slice(0, 5000)
    : "";

  if (!text) {
    throw apiError(
      "No clear speech was detected. Please try a shorter, clearer recording.",
      422,
      "OPENAI_NO_SPEECH"
    );
  }

  return {
    text,
    language: Array.isArray(result?.languages)
      ? result.languages[0]?.code || languageConfig.transcription
      : languageConfig.transcription,
    provider: "openai",
    model: env.OPENAI_TRANSCRIPTION_MODEL || "gpt-transcribe",
    selectedLanguage: language,
    notice: languageConfig.pidgin
      ? "Nigerian Pidgin recognition should be reviewed before sending, especially where the speaker mixes Pidgin and English."
      : null,
  };
}

export function parseOpenAIJson(text) {
  if (
    text &&
    typeof text === "object" &&
    !Array.isArray(text)
  ) {
    return text;
  }

  const raw = typeof text === "string" ? text.trim() : "";

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function openAIError(
  message,
  status = 502,
  code = "OPENAI_API_ERROR",
  cause
) {
  return apiError(message, status, code, cause);
}

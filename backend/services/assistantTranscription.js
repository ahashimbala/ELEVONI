import { transcribeOpenAI } from "./openaiApi.js";
import { transcribeDynamicASR } from "./dynamicAsr.js";

export async function transcribeAssistantAudio(options) {
  const provider = String(process.env.ASSISTANT_ASR_PROVIDER || "openai").trim().toLowerCase();
  if (provider === "dynamic-asr") return transcribeDynamicASR(options);
  if (provider === "openai") return transcribeOpenAI(options);
  const error = new Error("Unsupported assistant transcription provider. Use dynamic-asr or openai.");
  error.status = 503;
  error.code = "ASSISTANT_ASR_PROVIDER_INVALID";
  throw error;
}

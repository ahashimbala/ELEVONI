// Backwards-compatible aliases for older modules that still import these names.
// New code should import from assistantConfig.mjs.
import {
  ASSISTANT_CLIENT_TIMEOUT_MS,
  ASSISTANT_SERVER_TIMEOUT_MS,
  ASSISTANT_TRANSCRIPTION_TIMEOUT_MS,
} from "./assistantConfig.mjs";

export const NATLAS_SDK_TIMEOUT_MS = ASSISTANT_SERVER_TIMEOUT_MS;
export const NATLAS_CLIENT_TIMEOUT_MS = ASSISTANT_CLIENT_TIMEOUT_MS;
export const NATLAS_TTS_TIMEOUT_MS = ASSISTANT_TRANSCRIPTION_TIMEOUT_MS;

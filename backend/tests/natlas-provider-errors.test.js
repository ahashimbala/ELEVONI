import test from "node:test";
import assert from "node:assert/strict";
import { mapNAtlasProviderError } from "../utils/natlasProviderErrors.js";

test("SDK timeout becomes a 504 gateway timeout", () => {
  const mapped = mapNAtlasProviderError(Object.assign(new Error("late"), { name: "TimeoutError" }));
  assert.equal(mapped.status, 504);
  assert.equal(mapped.code, "NATLAS_TIMEOUT");
});

test("client abort becomes a cancellation result", () => {
  const controller = new AbortController();
  controller.abort();
  const mapped = mapNAtlasProviderError(Object.assign(new Error("aborted"), { name: "AbortError" }), { abortSignal: controller.signal });
  assert.equal(mapped.status, 499);
  assert.equal(mapped.code, "NATLAS_CLIENT_ABORTED");
});

test("gateway authentication failure becomes a safe service-unavailable error", () => {
  const mapped = mapNAtlasProviderError(Object.assign(new Error("unauthorized"), { status: 401, name: "AuthError" }));
  assert.equal(mapped.status, 503);
  assert.equal(mapped.code, "NATLAS_AUTH_FAILED");
  assert.doesNotMatch(mapped.message, /api.?key|token/i);
});

test("rate limiting preserves HTTP 429", () => {
  const mapped = mapNAtlasProviderError(Object.assign(new Error("rate"), { status: 429, name: "RateLimitError" }));
  assert.equal(mapped.status, 429);
  assert.equal(mapped.code, "NATLAS_RATE_LIMITED");
});

test("other provider failures are safe 502 responses", () => {
  const mapped = mapNAtlasProviderError(Object.assign(new Error("internal provider detail"), { status: 500 }));
  assert.equal(mapped.status, 502);
  assert.equal(mapped.code, "NATLAS_PROVIDER_ERROR");
  assert.doesNotMatch(mapped.message, /internal provider detail/);
});

test("transcription provider failures have transcription-specific messaging", () => {
  const mapped = mapNAtlasProviderError(new Error("network"), { operation: "transcription" });
  assert.equal(mapped.status, 502);
  assert.equal(mapped.code, "NATLAS_ASR_ERROR");
  assert.match(mapped.message, /transcribe/i);
});

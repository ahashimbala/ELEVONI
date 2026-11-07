import test from "node:test";
import assert from "node:assert/strict";
import { NATLAS_CLIENT_TIMEOUT_MS, NATLAS_SDK_TIMEOUT_MS, NATLAS_TTS_TIMEOUT_MS } from "./natlasConfig.mjs";

test("browser timeout leaves time for backend to return its SDK timeout response", () => {
  assert.ok(NATLAS_CLIENT_TIMEOUT_MS > NATLAS_SDK_TIMEOUT_MS);
  assert.ok(NATLAS_CLIENT_TIMEOUT_MS - NATLAS_SDK_TIMEOUT_MS >= 10_000);
});

test("TTS timeout is shorter than the overall browser request timeout", () => {
  assert.ok(NATLAS_TTS_TIMEOUT_MS < NATLAS_CLIENT_TIMEOUT_MS);
});

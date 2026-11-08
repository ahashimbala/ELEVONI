import test from "node:test";
import assert from "node:assert/strict";
import { NATLAS_CLIENT_TIMEOUT_MS, NATLAS_SDK_TIMEOUT_MS, NATLAS_TTS_TIMEOUT_MS } from "./natlasConfig.mjs";

test("legacy N-ATLaS timeout exports remain compatible with the assistant deadlines", () => {
  assert.ok(NATLAS_CLIENT_TIMEOUT_MS > NATLAS_SDK_TIMEOUT_MS);
  assert.ok(NATLAS_TTS_TIMEOUT_MS > NATLAS_SDK_TIMEOUT_MS);
});

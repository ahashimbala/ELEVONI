import test from "node:test";
import assert from "node:assert/strict";
import { ASSISTANT_CLIENT_TIMEOUT_MS, ASSISTANT_SERVER_TIMEOUT_MS, ASSISTANT_TRANSCRIPTION_TIMEOUT_MS } from "./assistantConfig.mjs";

test("assistant client deadline exceeds server model deadline", () => {
  assert.ok(ASSISTANT_CLIENT_TIMEOUT_MS > ASSISTANT_SERVER_TIMEOUT_MS);
  assert.ok(ASSISTANT_TRANSCRIPTION_TIMEOUT_MS > ASSISTANT_SERVER_TIMEOUT_MS);
});

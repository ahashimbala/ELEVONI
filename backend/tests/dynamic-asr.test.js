import test from "node:test";
import assert from "node:assert/strict";
import { transcribeDynamicASR } from "../services/dynamicAsr.js";

const audio = Buffer.from("test-audio-bytes");

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test("Dynamic ASR requires Modal endpoint and shared secret", async () => {
  await assert.rejects(
    transcribeDynamicASR({ audio, env: {} }),
    (error) => error.code === "DYNAMIC_ASR_NOT_CONFIGURED" && error.status === 503
  );
});

test("Dynamic ASR posts multipart audio and returns the existing transcript contract", async () => {
  let request;
  const result = await transcribeDynamicASR({
    audio,
    filename: "farmer voice.webm",
    mimeType: "audio/webm",
    language: "ha-NG",
    env: {
      DYNAMIC_ASR_MODAL_URL: "https://example.modal.run",
      DYNAMIC_ASR_MODAL_API_KEY: "test-secret",
    },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response(200, {
        success: true,
        text: "sannu da zuwa",
        model: "dynamic-asr-pocket-300m-int8",
        durationSeconds: 2.4,
      });
    },
  });

  assert.equal(request.url, "https://example.modal.run");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.ok(request.options.body instanceof FormData);
  assert.equal(result.text, "sannu da zuwa");
  assert.equal(result.language, "ha-NG");
  assert.equal(result.provider, "dynamic-asr");
  assert.equal(result.model, "dynamic-asr-pocket-300m-int8");
});

test("Dynamic ASR maps Modal authentication failure to a configuration error", async () => {
  await assert.rejects(
    transcribeDynamicASR({
      audio,
      env: { DYNAMIC_ASR_MODAL_URL: "https://example.modal.run", DYNAMIC_ASR_MODAL_API_KEY: "wrong" },
      fetchImpl: async () => response(401, { detail: "Unauthorized" }),
    }),
    (error) => error.code === "DYNAMIC_ASR_AUTH_FAILED" && error.status === 503
  );
});

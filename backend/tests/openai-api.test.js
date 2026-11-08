import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIResponse, transcribeOpenAI } from "../services/openaiApi.js";

const outputResponse = (text, model = "gpt-6.1-sol") => new Response(JSON.stringify({
  id: "resp_test", status: "completed", model,
  output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text }] }],
}), { status: 200, headers: { "content-type": "application/json" } });

test("Responses API sends server-side key, configured model and strict schema", async () => {
  let request;
  const result = await createOpenAIResponse({
    instructions: "Respond in Hausa only.",
    input: [{ role: "user", content: "Sannu" }],
    schema: { name: "test_schema", schema: { type: "object", additionalProperties: false, properties: { reply: { type: "string" } }, required: ["reply"] } },
    env: { OPENAI_API_KEY: "test-secret", OPENAI_MODEL: "gpt-6.1-sol", OPENAI_REASONING_EFFORT: "low" },
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return outputResponse('{"reply":"Sannu"}');
    },
  });
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.equal(request.body.model, "gpt-6.1-sol");
  assert.equal(request.body.text.format.strict, true);
  assert.deepEqual(result.parsed, { reply: "Sannu" });
});

test("Responses API refuses to run without a backend API key", async () => {
  await assert.rejects(
    createOpenAIResponse({ instructions: "test", input: "hello", env: {}, fetchImpl: async () => { throw new Error("should not fetch"); } }),
    { code: "OPENAI_NOT_CONFIGURED", status: 503 },
  );
});

test("OpenAI transcription sends the selected language hint and returns reviewable text", async () => {
  let form;
  const result = await transcribeOpenAI({
    audio: Buffer.from("test-audio"), filename: "farmer.webm", mimeType: "audio/webm", language: "ha-NG",
    env: { OPENAI_API_KEY: "test-secret", OPENAI_TRANSCRIPTION_MODEL: "gpt-transcribe" },
    fetchImpl: async (_url, options) => {
      form = options.body;
      return new Response(JSON.stringify({ text: "Ina son kaji", languages: [{ code: "ha" }] }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  assert.equal(form.get("model"), "gpt-transcribe");
  assert.equal(form.get("languages[]"), "ha");
  assert.equal(form.get("prompt"), null);
  assert.equal(result.text, "Ina son kaji");
  assert.equal(result.provider, "openai");
  assert.equal(result.selectedLanguage, "ha-NG");
});

test("Nigerian Pidgin transcription is explicitly prompted and uses the English language hint", async () => {
  let form;
  const result = await transcribeOpenAI({
    audio: Buffer.from("test-audio"), language: "pcm-NG",
    env: { OPENAI_API_KEY: "test-secret" },
    fetchImpl: async (_url, options) => {
      form = options.body;
      return new Response(JSON.stringify({ text: "How far, I dey come" }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  assert.equal(form.get("languages[]"), "en");
  assert.match(form.get("prompt"), /Nigerian Pidgin/);
  assert.equal(result.notice !== null, true);
});

test("OpenAI rate-limit errors are mapped to a clear retryable error", async () => {
  await assert.rejects(
    createOpenAIResponse({
      instructions: "test", input: "hello", env: { OPENAI_API_KEY: "test-secret" },
      fetchImpl: async () => new Response(JSON.stringify({ error: { message: "Rate limit reached" } }), { status: 429 }),
    }),
    { code: "OPENAI_RATE_LIMITED", status: 429 },
  );
});

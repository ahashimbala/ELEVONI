import test from "node:test";
import assert from "node:assert/strict";
import { parseNAtlasModelOutput } from "../utils/natlasResponse.js";

test("model response parses the expected reply and draft envelope", () => {
  assert.deepEqual(parseNAtlasModelOutput(JSON.stringify({ reply: "Hello", draft: null })), { reply: "Hello", draft: null });
});

test("model response can recover a JSON object surrounded by short prose", () => {
  assert.deepEqual(parseNAtlasModelOutput('Here is the result: {"reply":"Hello","draft":null}'), { reply: "Hello", draft: null });
});

test("malformed or non-object model output falls back to plain text without a draft", () => {
  assert.deepEqual(parseNAtlasModelOutput("I cannot parse this"), { reply: "I cannot parse this", draft: null });
  assert.deepEqual(parseNAtlasModelOutput("[]"), { reply: "[]", draft: null });
  assert.deepEqual(parseNAtlasModelOutput(""), { reply: "", draft: null });
});

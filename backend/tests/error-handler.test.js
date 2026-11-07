import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../middleware/errorHandler.js";

const mockResponse = (overrides = {}) => {
  const response = {
    headersSent: false,
    destroyed: false,
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    ...overrides,
  };
  return response;
};

test("malformed JSON is returned as a safe HTTP 400 response", () => {
  const error = new SyntaxError("Unexpected token in private parser detail");
  error.status = 400;
  error.body = "{not valid json";
  const response = mockResponse();
  errorHandler(error, { method: "POST", url: "/api/test", aborted: false }, response, () => {});
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { success: false, message: "Invalid JSON", status: 400 });
  assert.doesNotMatch(JSON.stringify(response.body), /Unexpected token|private parser detail/);
});

test("an already-sent response delegates the error to the next handler", () => {
  let nextError;
  const error = new Error("after headers");
  errorHandler(error, { method: "GET", url: "/api/test", aborted: false }, mockResponse({ headersSent: true }), (value) => { nextError = value; });
  assert.equal(nextError, error);
});

test("a disconnected request is not written to again", () => {
  const response = mockResponse({ destroyed: true });
  let nextCalled = false;
  errorHandler(new Error("client gone"), { method: "GET", url: "/api/test", aborted: true }, response, () => { nextCalled = true; });
  assert.equal(response.body, null);
  assert.equal(nextCalled, false);
});

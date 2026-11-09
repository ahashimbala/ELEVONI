import test from "node:test";
import assert from "node:assert/strict";
import securityHeaders from "../middleware/securityHeaders.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

function responseMock() {
  const headers = {};
  return {
    headers, statusCode: 200, body: null,
    setHeader(key, value) { headers[key] = value; },
    removeHeader(key) { delete headers[key]; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test("security headers are set without exposing Express", () => {
  const req = {};
  const res = responseMock();
  res.headers["X-Powered-By"] = "Express";
  let called = false;
  securityHeaders(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(res.headers["X-Frame-Options"], "DENY");
  assert.equal(res.headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(res.headers["X-Powered-By"], undefined);
});

test("rate limiter blocks requests above the configured window limit", () => {
  const limit = createRateLimiter({ windowMs: 60_000, max: 1, keyPrefix: `test-${Date.now()}` });
  const req = { ip: "192.0.2.10", socket: { remoteAddress: "192.0.2.10" } };
  const first = responseMock();
  let nextCalls = 0;
  limit(req, first, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
  const second = responseMock();
  limit(req, second, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
  assert.equal(second.statusCode, 429);
  assert.ok(second.headers["Retry-After"]);
});

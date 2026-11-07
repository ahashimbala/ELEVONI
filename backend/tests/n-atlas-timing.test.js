import test from "node:test";
import assert from "node:assert/strict";
import { createTimer } from "../utils/timingLogger.mjs";

test("timing logger generates a unique UUID when no request ID is supplied", () => {
  const first = createTimer();
  const second = createTimer();
  assert.match(first.correlationId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(first.correlationId, second.correlationId);
});

test("timing logger preserves a supplied request ID across stages", () => {
  const originalLog = console.log;
  const entries = [];
  console.log = (...args) => entries.push(args);
  try {
    const timer = createTimer("request-123");
    timer.log("grounding-start");
    timer.log("grounding-end", { counts: { ownProducts: 2 } });
  } finally {
    console.log = originalLog;
  }
  const payloads = entries.map((entry) => JSON.parse(entry[1]));
  assert.equal(payloads.length, 2);
  assert.ok(payloads.every((entry) => entry.correlationId === "request-123"));
  assert.ok(payloads.every((entry) => Number.isFinite(entry.elapsedMs)));
});

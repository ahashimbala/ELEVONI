import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createClientAbortContext } from "../utils/clientAbort.js";

const lifecycle = ({ aborted = false, writableEnded = false } = {}) => {
  const req = new EventEmitter();
  req.aborted = aborted;
  const res = new EventEmitter();
  res.writableEnded = writableEnded;
  return { req, res };
};

test("an interrupted incoming request aborts the downstream operation", () => {
  const { req, res } = lifecycle();
  const context = createClientAbortContext(req, res);
  req.emit("aborted");
  assert.equal(context.signal.aborted, true);
  context.cleanup();
});

test("a response closed before it ends aborts the downstream operation", () => {
  const { req, res } = lifecycle();
  const context = createClientAbortContext(req, res);
  res.emit("close");
  assert.equal(context.signal.aborted, true);
  context.cleanup();
});

test("a normal completed response closing does not abort the downstream operation", () => {
  const { req, res } = lifecycle({ writableEnded: true });
  const context = createClientAbortContext(req, res);
  res.emit("close");
  assert.equal(context.signal.aborted, false);
  context.cleanup();
});

test("an already-aborted request is handled before work starts", () => {
  const { req, res } = lifecycle({ aborted: true });
  const context = createClientAbortContext(req, res);
  assert.equal(context.signal.aborted, true);
  context.cleanup();
});

test("cleanup removes the lifecycle listeners", () => {
  const { req, res } = lifecycle();
  const context = createClientAbortContext(req, res);
  assert.equal(req.listenerCount("aborted"), 1);
  assert.equal(res.listenerCount("close"), 1);
  context.cleanup();
  assert.equal(req.listenerCount("aborted"), 0);
  assert.equal(res.listenerCount("close"), 0);
});

import test from "node:test";
import assert from "node:assert/strict";
import { isNAtlasDemoEnabled } from "../utils/natlasDemoAccess.js";

test("private N-ATLaS demo is disabled unless explicitly enabled", () => {
  assert.equal(isNAtlasDemoEnabled({ NODE_ENV: "development", NATLAS_DEMO_ENABLED: "false" }), false);
  assert.equal(isNAtlasDemoEnabled({ NODE_ENV: "development" }), false);
});

test("private N-ATLaS demo can be enabled in a non-production environment", () => {
  assert.equal(isNAtlasDemoEnabled({ NODE_ENV: "development", NATLAS_DEMO_ENABLED: "true" }), true);
  assert.equal(isNAtlasDemoEnabled({ NODE_ENV: "test", NATLAS_DEMO_ENABLED: "true" }), true);
});

test("private N-ATLaS demo remains disabled in production even if the flag is true", () => {
  assert.equal(isNAtlasDemoEnabled({ NODE_ENV: "production", NATLAS_DEMO_ENABLED: "true" }), false);
});

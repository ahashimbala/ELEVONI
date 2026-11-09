import test from "node:test";
import assert from "node:assert/strict";
import { normalizeInsightsPeriod } from "../services/vendorSalesInsights.js";
test("sales insights accept only supported periods", () => {
  assert.equal(normalizeInsightsPeriod("30d"), "30d");
  assert.equal(normalizeInsightsPeriod("90d"), "90d");
  assert.equal(normalizeInsightsPeriod("365d"), "365d");
  assert.equal(normalizeInsightsPeriod("all"), "all");
  assert.equal(normalizeInsightsPeriod("unknown"), "90d");
});

import test from "node:test";
import assert from "node:assert/strict";
import { buildRecentSalesSummary } from "../utils/salesSummary.js";

test("recent sales summary separates verified and unverified amounts", () => {
  const summary = buildRecentSalesSummary([
    { totalAmount: 12000, verificationStatus: "verified" },
    { totalAmount: 5000, verificationStatus: "unverified" },
    { totalAmount: "3000", verificationStatus: "verified" },
  ]);
  assert.equal(summary.recordCount, 3);
  assert.equal(summary.currency, "NGN");
  assert.equal(summary.recordedValue, 20000);
  assert.equal(summary.verifiedCount, 2);
  assert.equal(summary.verifiedValue, 15000);
  assert.equal(summary.unverifiedCount, 1);
  assert.equal(summary.unverifiedValue, 5000);
});

test("missing or invalid amounts remain zero rather than becoming invented totals", () => {
  const summary = buildRecentSalesSummary([
    { totalAmount: undefined, verificationStatus: "unverified" },
    { totalAmount: "not-a-number", verificationStatus: "verified" },
  ]);
  assert.equal(summary.recordCount, 2);
  assert.equal(summary.recordedValue, 0);
  assert.equal(summary.verifiedValue, 0);
  assert.equal(summary.unverifiedValue, 0);
});

test("an empty sales list produces an explicitly scoped zero summary", () => {
  const summary = buildRecentSalesSummary([]);
  assert.equal(summary.recordCount, 0);
  assert.equal(summary.recordedValue, 0);
  assert.match(summary.scope, /12 most recent/);
});

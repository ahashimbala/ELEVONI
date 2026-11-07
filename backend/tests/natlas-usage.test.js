import test from "node:test";
import assert from "node:assert/strict";
import {
  NATLAS_ROLLING_WINDOW_MS,
  NATLAS_USER_LIMIT,
  NATLAS_MAX_ACTIVE_USERS,
  buildNAtlasAdmissionFilter,
  buildNAtlasAdmissionPipeline,
  hashNAtlasIdentity,
  resolveNAtlasIdentity,
} from "../services/natlasUsageRules.mjs";

const now = new Date("2026-11-07T10:00:00.000Z");
const cutoff = new Date(now.getTime() - NATLAS_ROLLING_WINDOW_MS);

test("the N-ATLaS cap is 1,000 unique users over exactly 30 days", () => {
  assert.equal(NATLAS_USER_LIMIT, 1000);
  assert.equal(NATLAS_MAX_ACTIVE_USERS, 1000);
  assert.equal(NATLAS_ROLLING_WINDOW_MS, 30 * 24 * 60 * 60 * 1000);
  assert.equal(cutoff.toISOString(), "2026-10-08T10:00:00.000Z");
});

test("anonymous browser identity must be a UUID", () => {
  const request = { headers: { "x-elevoni-visitor-id": "b2c1a2d3-e4f5-4678-9abc-123456789abc" } };
  assert.deepEqual(resolveNAtlasIdentity(request), {
    identity: "anonymous:b2c1a2d3-e4f5-4678-9abc-123456789abc",
    identityType: "anonymous",
  });
  assert.equal(resolveNAtlasIdentity({ headers: { "x-elevoni-visitor-id": "not-a-uuid" } }), null);
});

test("approved vendor identity takes precedence over anonymous browser identity", () => {
  const identity = resolveNAtlasIdentity({
    vendor: { profileId: "vendor-profile-123" },
    headers: { "x-elevoni-visitor-id": "b2c1a2d3-e4f5-4678-9abc-123456789abc" },
  });
  assert.deepEqual(identity, { identity: "account:vendor-profile-123", identityType: "account", aliasIdentity: "anonymous:b2c1a2d3-e4f5-4678-9abc-123456789abc" });
});

test("HMAC identity hashes are stable and do not expose source identifiers", () => {
  const first = hashNAtlasIdentity("anonymous:visitor-123", "a-secret-value-that-is-at-least-32-chars");
  const second = hashNAtlasIdentity("anonymous:visitor-123", "a-secret-value-that-is-at-least-32-chars");
  const different = hashNAtlasIdentity("anonymous:visitor-456", "a-secret-value-that-is-at-least-32-chars");
  assert.equal(first, second);
  assert.notEqual(first, different);
  assert.equal(first.length, 64);
  assert.equal(first.includes("visitor-123"), false);
});

test("admission filter allows an existing active user or a new user below capacity", () => {
  const filter = buildNAtlasAdmissionFilter("hashed-user", cutoff);
  assert.equal(filter._id, "natlas-rolling-30d");
  assert.equal(filter.$expr.$or.length, 2);
  assert.equal(filter.$expr.$or[1].$lt[1], NATLAS_MAX_ACTIVE_USERS);
});

test("admission update prunes expired users, refreshes returning users and appends new users", () => {
  const pipeline = buildNAtlasAdmissionPipeline({
    userKey: "hashed-user",
    identityType: "anonymous",
    service: "customer-chat",
    now,
    cutoff,
  });
  assert.equal(pipeline.length, 1);
  const set = pipeline[0].$set;
  assert.equal(set.lastUpdatedAt, now);
  assert.ok(set.users.$let.vars.activeUsers.$filter);
  assert.ok(set.users.$let.in.$cond);
});

test("authenticated account identity is shared across customer and vendor roles", async () => {
  const { resolveNAtlasIdentity } = await import("../services/natlasUsageRules.mjs");
  assert.deepEqual(resolveNAtlasIdentity({ auth: { userId: "user-42", role: "customer" }, headers: { "x-elevoni-visitor-id": "b2c1a2d3-e4f5-4678-9abc-123456789abc" } }), {
    identity: "account:user-42", identityType: "account", aliasIdentity: "anonymous:b2c1a2d3-e4f5-4678-9abc-123456789abc",
  });
  assert.deepEqual(resolveNAtlasIdentity({ auth: { userId: "user-42", role: "vendor" } }), {
    identity: "account:user-42", identityType: "account",
  });
});

test("production usage hashing fails closed without the dedicated secret", async () => {
  const { getHmacSecret } = await import("../services/natlasUsageRules.mjs");
  assert.throws(() => getHmacSecret({ NODE_ENV: "production" }), { code: "NATLAS_USAGE_MONITOR_NOT_CONFIGURED", status: 503 });
  assert.equal(getHmacSecret({ NODE_ENV: "production", NATLAS_USAGE_HMAC_SECRET: "a".repeat(32) }), "a".repeat(32));
  assert.ok(getHmacSecret({ NODE_ENV: "development" }).length >= 32);
});


test("authenticated usage can merge the same browser's anonymous identity", () => {
  const filter = buildNAtlasAdmissionFilter("account-hash", cutoff, "anonymous-hash");
  assert.equal(filter.$expr.$or.length, 3);
  const pipeline = buildNAtlasAdmissionPipeline({
    userKey: "account-hash", aliasKey: "anonymous-hash", identityType: "account",
    service: "customer-chat", now, cutoff,
  });
  const update = pipeline[0].$set.users.$let.in.$cond;
  assert.equal(update.length, 3);
  assert.ok(update[2].$cond);
});

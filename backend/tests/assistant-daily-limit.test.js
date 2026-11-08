import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSISTANT_DAILY_PROMPT_LIMIT,
  ASSISTANT_DAILY_LIMIT_MESSAGE,
  checkAssistantDailyQuota,
  consumeAssistantPrompt,
  getAssistantDayKey,
  getAssistantResetAt,
  getAssistantDailyPromptLimit,
  sendAssistantDailyLimit,
} from "../services/assistantDailyLimit.js";

class FakeUsageModel {
  static rows = new Map();
  static async init() {}
  static key(filter) { return `${filter.identityHash}:${filter.dayKey}`; }
  static async updateOne(filter, update) {
    const key = this.key(filter);
    if (!this.rows.has(key)) this.rows.set(key, { ...update.$setOnInsert });
    return { acknowledged: true };
  }
  static findOne(filter) {
    const value = this.rows.get(this.key(filter));
    return {
      select() { return this; },
      lean: async () => value ? { promptCount: value.promptCount } : null,
    };
  }
  static async findOneAndUpdate(filter, update) {
    const value = this.rows.get(this.key(filter));
    if (!value || value.promptCount >= filter.promptCount.$lt) return null;
    value.promptCount += update.$inc.promptCount;
    value.lastSeenAt = update.$set.lastSeenAt;
    value.lastService = update.$set.lastService;
    return { ...value };
  }
  static reset() { this.rows.clear(); }
}

const env = { NODE_ENV: "test", ASSISTANT_DAILY_LIMIT: "10", ASSISTANT_USAGE_HMAC_SECRET: "a-secure-test-secret-with-more-than-32-characters" };
const now = new Date("2026-11-08T12:00:00.000Z");
const accountRequest = (id = "farmer-123") => ({ auth: { userId: id, role: "vendor" }, ip: "203.0.113.4", headers: {} });

 test("daily assistant quota is 10 prompts and uses the Africa/Lagos calendar day", () => {
  assert.equal(ASSISTANT_DAILY_PROMPT_LIMIT, 10);
  assert.equal(getAssistantDayKey(new Date("2026-11-08T23:30:00.000Z"), "Africa/Lagos"), "2026-11-09");
  assert.equal(getAssistantResetAt(new Date("2026-11-08T23:30:00.000Z"), "Africa/Lagos").toISOString(), "2026-11-09T23:00:00.000Z");
});

test("a user can submit ten prompts, while the eleventh is rejected", async () => {
  FakeUsageModel.reset();
  const req = accountRequest();
  for (let index = 0; index < 10; index += 1) {
    const result = await consumeAssistantPrompt(req, "vendor", { now, env, Model: FakeUsageModel });
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 9 - index);
  }
  const blocked = await consumeAssistantPrompt(req, "vendor", { now, env, Model: FakeUsageModel });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.used, 10);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.message, ASSISTANT_DAILY_LIMIT_MESSAGE);
});

test("customer and vendor assistants share one daily quota for the same account", async () => {
  FakeUsageModel.reset();
  const req = accountRequest("same-user");
  for (let index = 0; index < 6; index += 1) await consumeAssistantPrompt(req, "customer", { now, env, Model: FakeUsageModel });
  for (let index = 0; index < 4; index += 1) await consumeAssistantPrompt(req, "vendor", { now, env, Model: FakeUsageModel });
  const result = await checkAssistantDailyQuota(req, { now, env, Model: FakeUsageModel });
  assert.equal(result.allowed, false);
  assert.equal(result.used, 10);
});

test("anonymous storefront visitors are counted by their persistent visitor UUID", async () => {
  FakeUsageModel.reset();
  const req = { headers: { "x-elevoni-visitor-id": "b2c1a2d3-e4f5-4678-9abc-123456789abc" }, ip: "203.0.113.5" };
  const first = await consumeAssistantPrompt(req, "customer", { now, env, Model: FakeUsageModel });
  const second = await checkAssistantDailyQuota(req, { now, env, Model: FakeUsageModel });
  assert.equal(first.allowed, true);
  assert.equal(second.used, 1);
});

test("a new Lagos calendar day starts a fresh quota", async () => {
  FakeUsageModel.reset();
  const req = accountRequest();
  for (let index = 0; index < 10; index += 1) await consumeAssistantPrompt(req, "customer", { now, env, Model: FakeUsageModel });
  const nextDay = await checkAssistantDailyQuota(req, { now: new Date("2026-11-09T00:00:00.000Z"), env, Model: FakeUsageModel });
  assert.equal(nextDay.allowed, true);
  assert.equal(nextDay.used, 0);
});

test("daily-limit response uses HTTP 429 and the requested public-facing message", () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  sendAssistantDailyLimit(response, { used: 10, resetAt: "2026-11-09T23:00:00.000Z" });
  assert.equal(response.statusCode, 429);
  assert.equal(response.body.code, "ASSISTANT_DAILY_LIMIT_REACHED");
  assert.equal(response.body.message, ASSISTANT_DAILY_LIMIT_MESSAGE);
  assert.equal(response.body.remaining, 0);
});


test("production refuses to run without a dedicated or legacy HMAC secret", async () => {
  await assert.rejects(
    consumeAssistantPrompt(accountRequest("no-secret"), "customer", { now, env: { NODE_ENV: "production" }, Model: FakeUsageModel }),
    (error) => error.code === "ASSISTANT_USAGE_LIMIT_NOT_CONFIGURED" && error.status === 503,
  );
});


test("local development defaults to unlimited without touching MongoDB or requiring a session ID", async () => {
  const localEnv = { NODE_ENV: "development" };
  assert.equal(getAssistantDailyPromptLimit(localEnv), 0);
  const result = await consumeAssistantPrompt({}, "customer", { now, env: localEnv, Model: FakeUsageModel });
  assert.equal(result.allowed, true);
  assert.equal(result.unlimited, true);
  assert.equal(result.limit, null);
  assert.equal(result.remaining, null);
  assert.equal(result.resetAt, null);
});

test("production defaults to ten prompts when no override is provided", () => {
  assert.equal(getAssistantDailyPromptLimit({ NODE_ENV: "production" }), 10);
});

test("an explicit zero disables the cap and an explicit production ten enables it", () => {
  assert.equal(getAssistantDailyPromptLimit({ NODE_ENV: "production", ASSISTANT_DAILY_LIMIT: "0" }), 0);
  assert.equal(getAssistantDailyPromptLimit({ NODE_ENV: "development", ASSISTANT_DAILY_LIMIT: "10" }), 10);
});

test("invalid daily limit configuration fails closed", () => {
  assert.throws(() => getAssistantDailyPromptLimit({ NODE_ENV: "production", ASSISTANT_DAILY_LIMIT: "unlimited" }), (error) => error.code === "ASSISTANT_DAILY_LIMIT_INVALID");
});

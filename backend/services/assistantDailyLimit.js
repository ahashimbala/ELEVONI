import { createHmac } from "node:crypto";

export const ASSISTANT_DAILY_PROMPT_LIMIT = 10;
export const DEFAULT_ASSISTANT_TIME_ZONE = "Africa/Lagos";

// An explicit value always wins. Zero disables the daily cap (intended for local
// development); otherwise production defaults to 10 and non-production defaults
// to unlimited. The server, not the browser, decides the effective environment.
export function getAssistantDailyPromptLimit(env = process.env) {
  const configured = env.ASSISTANT_DAILY_LIMIT;
  if (configured === undefined || configured === null || String(configured).trim() === "") {
    return env.NODE_ENV === "production" ? ASSISTANT_DAILY_PROMPT_LIMIT : 0;
  }
  const value = Number(configured);
  if (!Number.isSafeInteger(value) || value < 0) {
    const error = new Error("ASSISTANT_DAILY_LIMIT must be a non-negative whole number. Use 0 for unlimited local development.");
    error.status = 503;
    error.code = "ASSISTANT_DAILY_LIMIT_INVALID";
    throw error;
  }
  return value;
}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIMIT_MESSAGE = "You've reached the daily limit for the agriculture assistant prototype. Please come back tomorrow.";

function configError() {
  const error = new Error("The assistant usage limit is not configured. Please try again later.");
  error.status = 503;
  error.code = "ASSISTANT_USAGE_LIMIT_NOT_CONFIGURED";
  return error;
}

function getSecret(env = process.env) {
  const secret = env.ASSISTANT_USAGE_HMAC_SECRET || env.NATLAS_USAGE_HMAC_SECRET
    || (env.NODE_ENV === "production" ? "" : "elevoni-local-assistant-daily-limit-key");
  if (!secret || secret.length < 32) throw configError();
  return secret;
}

function hashIdentity(identity, env = process.env) {
  return createHmac("sha256", getSecret(env)).update(identity).digest("hex");
}

function dayKeyFor(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
}

function nextResetAt(date, timeZone) {
  const current = zonedParts(date, timeZone);
  const nextDayUtcGuess = Date.UTC(current.year, current.month - 1, current.day + 1, 0, 0, 0);
  const offsetParts = zonedParts(new Date(nextDayUtcGuess), timeZone);
  const representedUtc = Date.UTC(offsetParts.year, offsetParts.month - 1, offsetParts.day, offsetParts.hour, offsetParts.minute, offsetParts.second);
  const offsetMs = representedUtc - nextDayUtcGuess;
  return new Date(nextDayUtcGuess - offsetMs);
}

function resolveIdentity(req) {
  if (req.auth?.userId) return { value: `account:${String(req.auth.userId)}`, type: "account" };
  if (req.vendor?.userId) return { value: `account:${String(req.vendor.userId)}`, type: "account" };

  const visitorId = req.get?.("X-Elevoni-Visitor-ID")
    || req.headers?.["x-elevoni-visitor-id"]
    || "";
  if (typeof visitorId === "string" && UUID_PATTERN.test(visitorId)) {
    return { value: `anonymous:${visitorId.toLowerCase()}`, type: "anonymous" };
  }

  const ip = String(req.ip || req.socket?.remoteAddress || "").trim();
  if (ip) return { value: `network:${ip.slice(0, 100)}`, type: "network" };
  const error = new Error("A stable assistant session could not be identified. Refresh the page and try again.");
  error.status = 400;
  error.code = "ASSISTANT_SESSION_ID_MISSING";
  throw error;
}

function buildContext(req, now, env) {
  const identity = resolveIdentity(req);
  const timeZone = env.ASSISTANT_DAILY_LIMIT_TIME_ZONE || DEFAULT_ASSISTANT_TIME_ZONE;
  let dayKey;
  try {
    dayKey = dayKeyFor(now, timeZone);
  } catch {
    const error = new Error("The assistant daily-limit time zone is invalid.");
    error.status = 503;
    error.code = "ASSISTANT_USAGE_TIME_ZONE_INVALID";
    throw error;
  }
  return {
    filter: { identityHash: hashIdentity(identity.value, env), dayKey },
    identityType: identity.type,
    dayKey,
    timeZone,
    resetAt: nextResetAt(now, timeZone).toISOString(),
  };
}

const indexSetup = new WeakMap();

async function ensureIndexes(Model) {
  if (!indexSetup.has(Model)) {
    const setup = (async () => {
      if (Model.collection?.createIndex) {
        await Model.collection.createIndex(
          { identityHash: 1, dayKey: 1 },
          { unique: true, name: "assistant_daily_identity_unique" },
        );
        await Model.collection.createIndex(
          { lastSeenAt: 1 },
          { expireAfterSeconds: 45 * 24 * 60 * 60, name: "assistant_daily_usage_ttl" },
        );
      } else if (typeof Model.init === "function") {
        await Model.init();
      }
    })();
    indexSetup.set(Model, setup);
  }
  return indexSetup.get(Model);
}

async function ensureUsageRow(Model, context, now, service) {
  await ensureIndexes(Model);
  try {
    await Model.updateOne(
      context.filter,
      {
        $setOnInsert: {
          ...context.filter,
          promptCount: 0,
          identityType: context.identityType,
          firstSeenAt: now,
          lastSeenAt: now,
          lastService: service,
        },
      },
      { upsert: true, setDefaultsOnInsert: false },
    );
  } catch (error) {
    // Two first-time requests can race to create the unique identity/day row.
    if (error?.code !== 11000) throw error;
  }
}

async function getUsage(Model, filter) {
  const query = Model.findOne(filter);
  const selected = query?.select ? query.select("promptCount") : query;
  const lean = selected?.lean ? selected.lean() : selected;
  return await lean;
}

export async function checkAssistantDailyQuota(req, {
  now = new Date(), env = process.env, Model = null,
} = {}) {
  const limit = getAssistantDailyPromptLimit(env);
  if (limit === 0) {
    return { allowed: true, unlimited: true, limit: null, used: 0, remaining: null, resetAt: null, message: null };
  }
  const context = buildContext(req, now, env);
  try {
    const UsageModel = Model || (await import("../models/assistantDailyUsage.js")).default;
    await ensureIndexes(UsageModel);
    const usage = await getUsage(UsageModel, context.filter);
    const used = Math.max(0, Number(usage?.promptCount) || 0);
    return {
      allowed: used < limit,
      unlimited: false,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      resetAt: context.resetAt,
      message: used >= limit ? LIMIT_MESSAGE : null,
    };
  } catch (error) {
    if (error?.status) throw error;
    const unavailable = new Error("The agriculture assistant is temporarily unavailable. Please try again later.");
    unavailable.status = 503;
    unavailable.code = "ASSISTANT_USAGE_LIMIT_UNAVAILABLE";
    throw unavailable;
  }
}

export async function consumeAssistantPrompt(req, service, {
  now = new Date(), env = process.env, Model = null,
} = {}) {
  const limit = getAssistantDailyPromptLimit(env);
  if (limit === 0) {
    return { allowed: true, unlimited: true, limit: null, used: 0, remaining: null, resetAt: null, message: null };
  }
  const context = buildContext(req, now, env);
  try {
    const UsageModel = Model || (await import("../models/assistantDailyUsage.js")).default;
    await ensureUsageRow(UsageModel, context, now, service);
    const usage = await UsageModel.findOneAndUpdate(
      { ...context.filter, promptCount: { $lt: limit } },
      { $inc: { promptCount: 1 }, $set: { lastSeenAt: now, lastService: service } },
      { new: true, returnDocument: "after" },
    );
    const used = Math.max(0, Number(usage?.promptCount) || 0);
    const allowed = Boolean(usage);
    return {
      allowed,
      unlimited: false,
      limit,
      used: allowed ? used : limit,
      remaining: allowed ? Math.max(0, limit - used) : 0,
      resetAt: context.resetAt,
      message: allowed ? null : LIMIT_MESSAGE,
    };
  } catch (error) {
    if (error?.status) throw error;
    const unavailable = new Error("The agriculture assistant is temporarily unavailable. Please try again later.");
    unavailable.status = 503;
    unavailable.code = "ASSISTANT_USAGE_LIMIT_UNAVAILABLE";
    throw unavailable;
  }
}

export function sendAssistantDailyLimit(res, quota) {
  return res.status(429).json({
    success: false,
    code: "ASSISTANT_DAILY_LIMIT_REACHED",
    message: LIMIT_MESSAGE,
    limit: quota?.limit ?? ASSISTANT_DAILY_PROMPT_LIMIT,
    used: quota?.used ?? quota?.limit ?? ASSISTANT_DAILY_PROMPT_LIMIT,
    remaining: 0,
    resetAt: quota?.resetAt || null,
  });
}

export { LIMIT_MESSAGE as ASSISTANT_DAILY_LIMIT_MESSAGE, dayKeyFor as getAssistantDayKey, nextResetAt as getAssistantResetAt };

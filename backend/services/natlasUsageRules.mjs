import { createHmac } from "node:crypto";

export const NATLAS_ROLLING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const NATLAS_USER_LIMIT = 1000;
// Awarri confirmed no more than 1,000 active end users in a rolling 30-day window.
export const NATLAS_MAX_ACTIVE_USERS = NATLAS_USER_LIMIT;
export const NATLAS_USAGE_COUNTER_ID = "natlas-rolling-30d";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function resolveNAtlasIdentity(req) {
  const visitorId = req.get?.("X-Elevoni-Visitor-ID") || req.headers?.["x-elevoni-visitor-id"] || "";
  const validVisitorId = typeof visitorId === "string" && UUID_PATTERN.test(visitorId);
  const aliasIdentity = validVisitorId ? `anonymous:${visitorId.toLowerCase()}` : undefined;
  if (req.auth?.userId && ["customer", "vendor", "admin"].includes(req.auth.role)) {
    return { identity: `account:${String(req.auth.userId)}`, identityType: "account", ...(aliasIdentity ? { aliasIdentity } : {}) };
  }
  if (req.vendor?.profileId) {
    return { identity: `account:${String(req.vendor.profileId)}`, identityType: "account", ...(aliasIdentity ? { aliasIdentity } : {}) };
  }
  if (!validVisitorId) return null;
  return { identity: aliasIdentity, identityType: "anonymous" };
}

export function getHmacSecret(env = process.env) {
  const secret = env.NATLAS_USAGE_HMAC_SECRET || (env.NODE_ENV === "production" ? "" : "elevoni-local-natlas-usage-only-key");
  if (!secret || secret.length < 32) {
    const error = new Error("N-ATLaS usage monitoring is not configured. Set NATLAS_USAGE_HMAC_SECRET to a random secret of at least 32 characters.");
    error.status = 503;
    error.code = "NATLAS_USAGE_MONITOR_NOT_CONFIGURED";
    throw error;
  }
  return secret;
}

export function hashNAtlasIdentity(identity, secret = getHmacSecret()) {
  return createHmac("sha256", secret).update(identity).digest("hex");
}

function activeUsersExpression(cutoff) {
  return {
    $filter: {
      input: { $ifNull: ["$users", []] },
      as: "activeUser",
      cond: { $gte: ["$$activeUser.lastSeenAt", cutoff] },
    },
  };
}

export function buildNAtlasAdmissionFilter(userKey, cutoff, aliasKey = null) {
  const activeUsers = activeUsersExpression(cutoff);
  const activeKeys = { $map: { input: activeUsers, as: "activeUser", in: "$$activeUser.userKey" } };
  const existingIdentity = [{ $in: [userKey, activeKeys] }];
  if (aliasKey) existingIdentity.push({ $in: [aliasKey, activeKeys] });
  // Existing active users remain admissible at the cap; new identities are
  // admitted only while the resulting rolling set is below the inclusive limit.
  existingIdentity.push({ $lt: [{ $size: activeUsers }, NATLAS_MAX_ACTIVE_USERS] });
  return {
    _id: NATLAS_USAGE_COUNTER_ID,
    $expr: { $or: existingIdentity },
  };
}

export function buildNAtlasAdmissionPipeline({ userKey, identityType, service, now, cutoff, aliasKey = null }) {
  const activeUsers = activeUsersExpression(cutoff);
  const activeKeys = { $map: { input: "$$activeUsers", as: "activeUser", in: "$$activeUser.userKey" } };
  const hasPrimary = { $in: [userKey, activeKeys] };
  const hasAlias = aliasKey ? { $in: [aliasKey, activeKeys] } : false;
  const updatePrimary = {
    $map: {
      input: { $filter: { input: "$$activeUsers", as: "activeUser", cond: aliasKey ? { $ne: ["$$activeUser.userKey", aliasKey] } : true } },
      as: "activeUser",
      in: {
        $cond: [
          { $eq: ["$$activeUser.userKey", userKey] },
          { $mergeObjects: ["$$activeUser", { lastSeenAt: now, lastService: service }] },
          "$$activeUser",
        ],
      },
    },
  };
  const updateAlias = {
    $map: {
      input: "$$activeUsers",
      as: "activeUser",
      in: {
        $cond: [
          { $eq: ["$$activeUser.userKey", aliasKey] },
          { $mergeObjects: ["$$activeUser", { userKey, identityType, lastSeenAt: now, lastService: service }] },
          "$$activeUser",
        ],
      },
    },
  };
  return [{
    $set: {
      users: {
        $let: {
          vars: { activeUsers },
          in: {
            $cond: [
              hasPrimary,
              updatePrimary,
              {
                $cond: [
                  hasAlias,
                  updateAlias,
                  {
                    $concatArrays: [
                      "$$activeUsers",
                      [{ userKey, identityType, firstSeenAt: now, lastSeenAt: now, lastService: service }],
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      lastUpdatedAt: now,
    },
  }];
}

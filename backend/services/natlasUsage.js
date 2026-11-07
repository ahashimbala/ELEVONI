import mongoose from "mongoose";
import NAtlasUsageEvent from "../models/nAtlasUsageEvent.js";
import { NATLAS_ROLLING_WINDOW_MS, NATLAS_USER_LIMIT, NATLAS_MAX_ACTIVE_USERS, NATLAS_USAGE_COUNTER_ID, hashNAtlasIdentity, getHmacSecret, buildNAtlasAdmissionFilter, buildNAtlasAdmissionPipeline } from "./natlasUsageRules.mjs";

let indexesPromise;

async function ensureEventIndexes() {
  if (!indexesPromise) indexesPromise = NAtlasUsageEvent.createIndexes();
  try { await indexesPromise; } catch (error) { indexesPromise = null; throw error; }
}

function isDuplicateKey(error) { return error?.code === 11000 || error?.code === 11001; }

async function countActiveUsers(counter, cutoff) {
  const document = await counter.findOne({ _id: NATLAS_USAGE_COUNTER_ID }, { projection: { users: 1 } });
  return (document?.users || []).filter((user) => user.lastSeenAt && new Date(user.lastSeenAt) >= cutoff).length;
}

/**
 * Atomically admits a unique N-ATLaS user into the active rolling 30-day set.
 * A single MongoDB document is the serialization point, so concurrent backend
 * instances cannot admit user 1,001. The set stores HMAC identifiers only.
 */
export async function recordNAtlasUsage({ identity, identityType, aliasIdentity, service, now = new Date(), env = process.env }) {
  if (!identity || !["account", "anonymous"].includes(identityType)) throw new TypeError("A valid N-ATLaS identity is required.");
  const allowedServices = new Set(["customer-chat", "customer-transcription", "customer-speech", "vendor-chat", "vendor-transcription", "vendor-speech"]);
  if (!allowedServices.has(service)) throw new TypeError("A valid N-ATLaS service is required.");
  if (env.NATLAS_ENABLED === "false") {
    return { allowed: false, reason: "disabled", activeUsers: 0, limit: NATLAS_USER_LIMIT };
  }
  if (!mongoose.connection.db) {
    const error = new Error("The N-ATLaS usage database is not connected.");
    error.status = 503;
    error.code = "NATLAS_USAGE_DATABASE_UNAVAILABLE";
    throw error;
  }

  const secret = getHmacSecret(env);
  const userKey = hashNAtlasIdentity(identity, secret);
  const aliasKey = aliasIdentity ? hashNAtlasIdentity(aliasIdentity, secret) : null;
  const cutoff = new Date(now.getTime() - NATLAS_ROLLING_WINDOW_MS);
  await ensureEventIndexes();
  const counter = mongoose.connection.db.collection("natlasusagecounters");
  let admitted = false;
  try {
    const result = await counter.updateOne(
      buildNAtlasAdmissionFilter(userKey, cutoff, aliasKey),
      buildNAtlasAdmissionPipeline({ userKey, identityType, service, now, cutoff, aliasKey }),
      { upsert: true },
    );
    admitted = result.matchedCount === 1 || result.upsertedCount === 1;
  } catch (error) {
    // At capacity, upsert cannot match the guarded singleton and the fixed _id
    // causes a duplicate-key result. Treat that as a normal cap rejection.
    if (!isDuplicateKey(error)) throw error;
    // Another request may have created the singleton or registered this same
    // user between our read and upsert. Retry once without upsert so the same
    // active user is not mistaken for a new user at capacity.
    const retry = await counter.updateOne(
      buildNAtlasAdmissionFilter(userKey, cutoff, aliasKey),
      buildNAtlasAdmissionPipeline({ userKey, identityType, service, now, cutoff, aliasKey }),
      { upsert: false },
    );
    admitted = retry.matchedCount === 1;
  }

  if (!admitted) {
    await counter.updateOne({ _id: NATLAS_USAGE_COUNTER_ID }, { $inc: { blockedRequests: 1 }, $set: { lastBlockedAt: now } }, { upsert: true });
    const activeUsers = await countActiveUsers(counter, cutoff);
    return { allowed: false, reason: "limit", activeUsers, limit: NATLAS_USER_LIMIT };
  }

  const dayKey = now.toISOString().slice(0, 10);
  try {
    if (aliasKey && aliasKey !== userKey) {
      await NAtlasUsageEvent.collection.deleteMany({ userKey: aliasKey });
    }
    await NAtlasUsageEvent.collection.updateOne(
      { userKey, dayKey },
      {
        $set: { lastSeenAt: now, service },
        $setOnInsert: { userKey, dayKey, identityType, firstSeenAt: now },
      },
      { upsert: true },
    );
  } catch (error) {
    // The atomic admission counter remains authoritative. A reporting event
    // failure must not turn an admitted N-ATLaS request into a failed request.
    console.error("N-ATLaS daily usage event could not be recorded", { name: error?.name || "Error", code: error?.code || null });
  }

  const activeUsers = await countActiveUsers(counter, cutoff);
  return { allowed: true, activeUsers, limit: NATLAS_USER_LIMIT, remaining: Math.max(0, NATLAS_MAX_ACTIVE_USERS - activeUsers) };
}

export async function getNAtlasUsageSnapshot({ now = new Date() } = {}) {
  if (!mongoose.connection.db) {
    const error = new Error("The N-ATLaS usage database is not connected.");
    error.status = 503;
    error.code = "NATLAS_USAGE_DATABASE_UNAVAILABLE";
    throw error;
  }
  const cutoff = new Date(now.getTime() - NATLAS_ROLLING_WINDOW_MS);
  const counterCollection = mongoose.connection.db.collection("natlasusagecounters");
  await counterCollection.updateOne(
    { _id: NATLAS_USAGE_COUNTER_ID },
    { $pull: { users: { lastSeenAt: { $lt: cutoff } } } },
  );
  const [counter, daily] = await Promise.all([
    counterCollection.findOne({ _id: NATLAS_USAGE_COUNTER_ID }),
    NAtlasUsageEvent.aggregate([
      { $match: { lastSeenAt: { $gte: cutoff } } },
      { $group: { _id: "$dayKey", users: { $addToSet: "$userKey" } } },
      { $project: { day: "$_id", activeUsers: { $size: "$users" } } },
      { $sort: { day: 1 } },
    ]),
  ]);
  const activeUserRecords = (counter?.users || []).filter((user) => user.lastSeenAt && new Date(user.lastSeenAt) >= cutoff);
  const activeUsers = activeUserRecords.length;
  const expiringWithin24h = activeUserRecords.filter((user) => new Date(user.lastSeenAt) < new Date(cutoff.getTime() + 24 * 60 * 60 * 1000)).length;
  const newUsersByDay = new Map();
  for (const user of activeUserRecords) {
    if (!user.firstSeenAt || new Date(user.firstSeenAt) < cutoff) continue;
    const day = new Date(user.firstSeenAt).toISOString().slice(0, 10);
    newUsersByDay.set(day, (newUsersByDay.get(day) || 0) + 1);
  }
  const dailyByDay = new Map(daily.map(({ day, activeUsers: count }) => [day, count]));
  for (const day of newUsersByDay.keys()) if (!dailyByDay.has(day)) dailyByDay.set(day, 0);
  const dailyUsage = [...dailyByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, count]) => ({ day, activeUsers: count, newUsers: newUsersByDay.get(day) || 0 }));
  const peakDailyActiveUsers = dailyUsage.reduce((peak, item) => Math.max(peak, item.activeUsers), 0);
  return {
    activeUsers,
    limit: NATLAS_USER_LIMIT,
    remaining: Math.max(0, NATLAS_MAX_ACTIVE_USERS - activeUsers),
    expiringWithin24h,
    percentUsed: Number(((activeUsers / NATLAS_USER_LIMIT) * 100).toFixed(1)),
    status: activeUsers >= NATLAS_USER_LIMIT ? "blocked" : activeUsers >= NATLAS_MAX_ACTIVE_USERS ? "new-user-admission-paused" : "enabled",
    windowStart: cutoff.toISOString(),
    measuredAt: now.toISOString(),
    blockedRequests: Number(counter?.blockedRequests || 0),
    lastBlockedAt: counter?.lastBlockedAt || null,
    peakDailyActiveUsers,
    dailyUsage,
  };
}

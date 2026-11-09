// Process-local fallback limiter. On serverless/multi-instance production deployments,
// pair this with a shared edge/WAF or Redis-backed limiter for globally consistent limits.
const stores = new Map();

export function createRateLimiter({ windowMs = 60_000, max = 30, message = "Too many requests. Please try again shortly.", keyPrefix = "api" } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const identity = String(req.ip || req.socket?.remoteAddress || "unknown").slice(0, 100);
    const key = `${keyPrefix}:${identity}`;
    let bucket = stores.get(key);
    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { startedAt: now, count: 0 };
      stores.set(key, bucket);
    }
    bucket.count += 1;
    if (stores.size > 10_000) {
      for (const [entryKey, entry] of stores) {
        if (now - entry.startedAt >= windowMs) stores.delete(entryKey);
      }
    }
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - bucket.startedAt)) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ success: false, message });
    }
    return next();
  };
}

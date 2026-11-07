import { randomUUID } from "node:crypto";

/** Create a request-scoped timer. Correlation IDs identify a single request, not a vendor. */
export const createTimer = (correlationId = randomUUID()) => {
  const start = Date.now();
  const log = (stage, extra = {}) => {
    const safeExtra = extra && typeof extra === "object" ? extra : {};
    console.log("[N-ATLaS]", JSON.stringify({
      timestamp: new Date().toISOString(),
      correlationId,
      stage,
      elapsedMs: Date.now() - start,
      ...safeExtra,
    }));
  };
  return { correlationId, log };
};

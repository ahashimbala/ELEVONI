import { recordNAtlasUsage } from "../services/natlasUsage.js";
import {
  NATLAS_USER_LIMIT,
  resolveNAtlasIdentity,
} from "../services/natlasUsageRules.mjs";

export function prepareNAtlasIdentity(req, res, next) {
  if (process.env.NATLAS_ENABLED === "false") {
    return res.status(503).json({ success: false, code: "NATLAS_DISABLED", message: "Elevoni Assistant is temporarily unavailable. Please try again later." });
  }
  const resolved = resolveNAtlasIdentity(req);
  if (!resolved) {
    return res.status(400).json({ success: false, code: "NATLAS_VISITOR_ID_REQUIRED", message: "Refresh the page and try again. Your browser session could not be identified." });
  }
  req.natlasIdentity = resolved;
  return next();
}

export async function admitNAtlasRequest(req, res) {
  const identity = req.natlasIdentity || resolveNAtlasIdentity(req);
  if (!identity) {
    res.status(400).json({ success: false, code: "NATLAS_VISITOR_ID_REQUIRED", message: "Refresh the page and try again. Your browser session could not be identified." });
    return false;
  }
  try {
    const result = await recordNAtlasUsage({ ...identity, service: req.natlasService, env: process.env });
    res.setHeader("X-NATLAS-USAGE-LIMIT", String(NATLAS_USER_LIMIT));
    if (!result.allowed) {
      res.status(result.reason === "disabled" ? 503 : 429).json({
        success: false,
        code: result.reason === "disabled" ? "NATLAS_DISABLED" : "NATLAS_USER_LIMIT_REACHED",
        message: result.reason === "disabled"
          ? "Elevoni Assistant is temporarily unavailable. Please try again later."
          : "Elevoni Assistant has reached its current user allowance for the rolling 30-day period. Please try again when access becomes available.",
        usage: { activeUsers: result.activeUsers, limit: result.limit, status: "blocked" },
      });
      return false;
    }
    res.setHeader("X-NATLAS-USERS-30D", String(result.activeUsers));
    return true;
  } catch (error) {
    console.error("N-ATLaS usage gate failed", { name: error?.name || "Error", code: error?.code || null });
    res.status(error?.status || 503).json({
      success: false,
      code: error?.code || "NATLAS_USAGE_GATE_UNAVAILABLE",
      message: "Elevoni Assistant is temporarily unavailable while its usage limit is checked. Please try again shortly.",
    });
    return false;
  }
}

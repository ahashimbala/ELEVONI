/**
 * Global error handling middleware. Never expose internal stack traces in production.
 */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (res.destroyed || req.aborted) return;

  const isMalformedJson = err instanceof SyntaxError
    && err.status === 400
    && Object.prototype.hasOwnProperty.call(err, "body");

  if (isMalformedJson) {
    return res.status(400).json({ success: false, message: "Invalid JSON", status: 400 });
  }

  const statusCode = Number.isInteger(err.status)
    ? err.status
    : Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Avoid logging raw messages/stacks here: database URLs and other private
  // configuration can be embedded in third-party error text.
  console.error("[ERROR]", {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path || req.url,
    statusCode,
    errorName: err.name || "Error",
    code: err.code || null,
  });

  const response = {
    success: false,
    message: isProduction && statusCode >= 500
      ? "An internal server error occurred. Please try again later."
      : err.message || "An unexpected error occurred.",
    status: statusCode,
  };

  if (!isProduction && err.stack) response.stack = err.stack;
  return res.status(statusCode).json(response);
};

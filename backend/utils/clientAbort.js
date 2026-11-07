/**
 * Link an Express request/response lifecycle to an AbortSignal.
 * `req.aborted` covers an interrupted incoming body; `res.close` covers a
 * client disconnect while the server is still preparing its response.
 */
export function createClientAbortContext(req, res) {
  const controller = new AbortController();
  const onRequestAborted = () => controller.abort(new Error("Client aborted request"));
  const onResponseClosed = () => {
    // A normal completed response also emits close. Only abort while a body is
    // still expected to be written to the client.
    if (!res.writableEnded) controller.abort(new Error("Client disconnected"));
  };

  if (req.aborted) onRequestAborted();
  req.once("aborted", onRequestAborted);
  res.once("close", onResponseClosed);

  return {
    signal: controller.signal,
    cleanup() {
      req.off("aborted", onRequestAborted);
      res.off("close", onResponseClosed);
    },
  };
}

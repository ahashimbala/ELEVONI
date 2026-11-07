const clean = (value, max = 100) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function getNAtlasProviderErrorDetails(error) {
  return {
    status: Number.isInteger(error?.status)
      ? error.status
      : Number.isInteger(error?.statusCode)
        ? error.statusCode
        : null,

    name: clean(error?.name, 80) || null,
    code: clean(error?.code, 100) || null,
    message: clean(error?.message, 300) || null,

    cause: error?.cause
      ? {
          name: clean(error.cause.name, 80) || null,
          code: clean(error.cause.code, 100) || null,
          message: clean(error.cause.message, 300) || null,
        }
      : null,
  };
}
function providerError(message, status, code, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.status = status;
  error.code = code;
  return error;
}

export function mapNAtlasProviderError(providerErrorValue, { abortSignal, operation = "chat" } = {}) {
  const details = getNAtlasProviderErrorDetails(providerErrorValue);

  if (abortSignal?.aborted || details.name === "AbortError") {
    return providerError("N-ATLaS request was cancelled.", 499, "NATLAS_CLIENT_ABORTED", providerErrorValue);
  }
  if (details.name === "TimeoutError" || details.status === 408) {
    return providerError("N-ATLaS took too long to respond. Please try again.", 504, "NATLAS_TIMEOUT", providerErrorValue);
  }

  const isAuth = details.status === 401 || details.status === 403 || /AuthError/i.test(details.name || "");
  const isRateLimit = details.status === 429 || /RateLimitError/i.test(details.name || "");
  const isBadRequest = details.status >= 400 && details.status < 500;

  if (isAuth) {
    return providerError("N-ATLaS gateway rejected the configured credentials or model access.", 503, "NATLAS_AUTH_FAILED", providerErrorValue);
  }
  if (isRateLimit) {
    return providerError("N-ATLaS is busy right now. Please try again shortly.", 429, "NATLAS_RATE_LIMITED", providerErrorValue);
  }
  if (isBadRequest) {
    return providerError("N-ATLaS could not process this request. Check the message and try again.", 400, "NATLAS_REQUEST_REJECTED", providerErrorValue);
  }

  return providerError(
    operation === "transcription"
      ? "N-ATLaS could not transcribe that recording. Try a shorter, clearer recording."
      : "N-ATLaS could not complete that request. Check gateway availability and configuration.",
    502,
    operation === "transcription" ? "NATLAS_ASR_ERROR" : "NATLAS_PROVIDER_ERROR",
    providerErrorValue,
  );
}

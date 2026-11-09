export function logSafeError(label, error) {
  console.error(label, {
    name: typeof error?.name === "string" ? error.name.slice(0, 80) : "Error",
    code: typeof error?.code === "string" || typeof error?.code === "number" ? error.code : null,
    status: Number.isInteger(error?.status) ? error.status : null,
  });
}

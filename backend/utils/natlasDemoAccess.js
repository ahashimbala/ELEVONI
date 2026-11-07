/** N-ATLaS is a private evaluation feature and is never enabled in production. */
export function isNAtlasDemoEnabled(env = process.env) {
  return env.NODE_ENV !== "production" && env.NATLAS_DEMO_ENABLED === "true";
}

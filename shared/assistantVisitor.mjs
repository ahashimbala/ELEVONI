const VISITOR_STORAGE_KEY = "elevoni-assistant-visitor-id";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createUuid(cryptoApi) {
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === "function") cryptoApi.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getAssistantVisitorId(options = {}) {
  const cryptoApi = options.cryptoApi || globalThis.crypto;
  let storage = options.storage;
  if (!storage) {
    try { storage = globalThis.localStorage; } catch { storage = null; }
  }
  try {
    const existing = storage?.getItem(VISITOR_STORAGE_KEY);
    if (typeof existing === "string" && UUID_PATTERN.test(existing)) return existing;
    const created = createUuid(cryptoApi);
    storage?.setItem(VISITOR_STORAGE_KEY, created);
    return created;
  } catch {
    return createUuid(cryptoApi);
  }
}

export { VISITOR_STORAGE_KEY };

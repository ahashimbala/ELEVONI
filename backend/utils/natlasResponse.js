/** Parse the JSON envelope expected from N-ATLaS without trusting model output. */
export function parseNAtlasModelOutput(text) {
  const raw = String(text || "").trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(raw.slice(start, end + 1));
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { reply: raw, draft: null };
  }
  return parsed;
}

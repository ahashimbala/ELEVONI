// Shared language constants for N‑ATLaS integration
// Supports the four languages required by Elevoni.
export const LANGUAGES = [
  { code: "en-NG", label: "English", greeting: "Hello. What are you working on today?", placeholder: "Ask N‑ATLAS anything about your farm or marketplace…" },
  { code: "ha-NG", label: "Hausa", greeting: "Sannu. Me kake son yi a yau?", placeholder: "Yi magana da N‑ATLAS game da gonarka…" },
  { code: "ig-NG", label: "Igbo", greeting: "Ndewo. Kedu ihe ị chọrọ ime taa?", placeholder: "Gwa N‑ATLAS gbasara ugbo gị…" },
  { code: "yo-NG", label: "Yorùbá", greeting: "Ẹ káàbọ̀. Kí ni o fẹ́ ṣe lónìí?", placeholder: "Bá N‑ATLAS sọ̀rọ̀ nípa oko rẹ…" },
];

// Mapping to TTS language codes used by the backend service (if enabled)
export const LANGUAGE_TTS_CODES = {
  "en-NG": "en",
  "ha-NG": "ha",
  "ig-NG": "ig",
  "yo-NG": "yo",
};

export const SUPPORTED_LANGUAGES = LANGUAGES.map(l => l.code);

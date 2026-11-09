const ACTIONS = new Set([
  "none",
  "set_quantity",
  "add_quantity",
  "subtract_quantity",
  "remove_item",
  "clear_cart",
  "view_cart",
  "checkout",
]);

const clean = (value, max = 120) => typeof value === "string" ? value.trim().slice(0, max) : "";
const normalise = (value) => clean(value, 180).toLowerCase()
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
const number = (value) => value === null || value === undefined || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;

export function inferCustomerCartRequest(raw = {}, message = "") {
  const text = clean(message, 1200);
  const lower = text.toLowerCase();
  let action = ACTIONS.has(raw.action) ? raw.action : "none";
  let productName = clean(raw.productName, 120);
  let quantity = number(raw.quantity);
  let unit = clean(raw.unit, 24).toLowerCase();

  if (action === "none") {
    if (/\b(clear|empty|remove everything from)\b.*\b(cart|basket)\b/.test(lower)) action = "clear_cart";
    else if (/\b(show|view|open|see|go to|check)\b.*\b(cart|basket)\b/.test(lower)) action = "view_cart";
    else if (/\b(check ?out|place (my )?order|proceed to payment)\b/.test(lower)) action = "checkout";
    else if (/\b(remove|delete|take out)\b/.test(lower) && /\b(cart|basket|catfish|fish)\b/.test(lower)) action = /\b\d+(?:\.\d+)?\s*(?:kg|kilos?|kilograms?)\b/.test(lower) ? "subtract_quantity" : "remove_item";
    else if (/\b(add|increase)\b.*\b(more|another|extra)\b|\b(more|another|extra)\b.*\b(add|kg|kilos?)\b/.test(lower)) action = "add_quantity";
    else {
      const quantityMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*(kg|kilos?|kilograms?)\b/);
      const purchaseIntent = /\b(i want|i need|i would like|i'd like|buy|purchase|get me|put .* in (my )?cart|add .* to (my )?cart)\b/.test(lower);
      if (quantityMatch && purchaseIntent) action = "set_quantity";
    }
  }

  if (quantity === null) {
    const match = lower.match(/\b(\d+(?:\.\d+)?)\s*(kg|kilos?|kilograms?)\b/);
    if (match) quantity = Number(match[1]);
  }
  if (!unit && /\b(kg|kilos?|kilograms?)\b/.test(lower)) unit = "kg";
  if (!productName) {
    const productMatch = lower.match(/\b(smoked\s+catfish|smoked\s+fish|catfish)\b/i);
    if (productMatch) productName = productMatch[1];
  }
  return { action, productName, quantity, unit };
}

export function matchDirectCatalogueProduct(products, query) {
  const target = normalise(query);
  if (!target) return { product: null, ambiguous: false, candidates: [] };
  const tokens = target.split(" ").filter((token) => token.length > 1 && !["the", "my", "some", "please", "buy", "want", "need", "get", "me", "add", "cart", "kg", "kilo", "kilos", "kilogram", "kilograms"].includes(token));
  if (!tokens.length) return { product: null, ambiguous: false, candidates: [] };

  const ranked = (Array.isArray(products) ? products : []).map((product) => {
    const name = normalise(product?.name);
    const searchable = normalise(`${product?.name || ""} ${product?.description || ""} ${product?.category || ""}`);
    let score = 0;
    if (name === target) score = 100;
    else if (name.includes(target)) score = 90;
    else if (target.includes(name) && name.length > 2) score = 80;
    score += tokens.reduce((total, token) => total + (searchable.includes(token) ? 12 : 0), 0);
    return { product, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

  if (!ranked.length || ranked[0].score < tokens.length * 12) {
    return { product: null, ambiguous: false, candidates: [] };
  }
  const tied = ranked.filter((item) => item.score === ranked[0].score);
  if (tied.length > 1) return { product: null, ambiguous: true, candidates: tied.map((item) => item.product) };
  return { product: ranked[0].product, ambiguous: false, candidates: [ranked[0].product] };
}

export function resolveCartQuantity({ action, requestedQuantity, currentQuantity = 0, unit = "" }) {
  const requested = number(requestedQuantity);
  const current = Math.max(0, Math.floor(number(currentQuantity) || 0));
  if (["set_quantity", "add_quantity", "subtract_quantity"].includes(action)) {
    if (!Number.isSafeInteger(requested) || requested < 1 || requested > 500) {
      return { ok: false, reason: "quantity" };
    }
    if (unit && !["kg", "kilo", "kilos", "kilogram", "kilograms"].includes(unit.toLowerCase())) {
      return { ok: false, reason: "unit" };
    }
  }
  if (action === "set_quantity") return { ok: true, quantity: requested };
  if (action === "add_quantity") {
    const next = current + requested;
    return next <= 500 ? { ok: true, quantity: next } : { ok: false, reason: "quantity" };
  }
  if (action === "subtract_quantity") {
    if (current < 1) return { ok: false, reason: "not_in_cart" };
    return { ok: true, quantity: Math.max(0, current - requested) };
  }
  if (action === "remove_item") {
    if (current < 1) return { ok: false, reason: "not_in_cart" };
    return { ok: true, quantity: 0 };
  }
  return { ok: false, reason: "unsupported_action" };
}

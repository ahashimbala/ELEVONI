import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../shared/categoryConstants.mjs";

export { SUBCATEGORIES_BY_CATEGORY };

const UNITS = new Set(PRODUCT_UNITS);
const cleanString = (value, max = 300) => typeof value === "string" ? value.trim().slice(0, max) : "";

/** Validate model-generated listing suggestions against every active form category. */
export function safeDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = {
    name: cleanString(value.name, 160),
    category: cleanString(value.category, 80),
    subcategory: cleanString(value.subcategory, 80),
    quantity: value.quantity === null || value.quantity === undefined ? "" : String(value.quantity).slice(0, 30),
    unit: cleanString(value.unit, 20),
    price: value.price === null || value.price === undefined ? "" : String(value.price).slice(0, 30),
    sourceText: cleanString(value.sourceText, 1000),
    description: cleanString(value.description, 2000),
    originState: cleanString(value.originState, 100),
    originLga: cleanString(value.originLga, 120),
    species: cleanString(value.species, 80),
    condition: cleanString(value.condition, 40),
    productionMethod: cleanString(value.productionMethod, 60),
    weightRange: cleanString(value.weightRange, 60),
  };
  if (draft.category && !PRODUCT_CATEGORIES.includes(draft.category)) draft.category = "";
  if (draft.subcategory && !(SUBCATEGORIES_BY_CATEGORY[draft.category] || []).includes(draft.subcategory)) draft.subcategory = "";
  if (draft.unit && !UNITS.has(draft.unit)) draft.unit = "";
  if (draft.quantity && (!Number.isFinite(Number(draft.quantity)) || Number(draft.quantity) <= 0)) draft.quantity = "";
  if (draft.price && (!Number.isFinite(Number(draft.price)) || Number(draft.price) <= 0)) draft.price = "";
  return draft;
}


const SALE_UNITS = new Set(PRODUCT_UNITS);
const SALE_CHANNELS = new Set(["phone", "whatsapp", "in_person", "other"]);
const PAYMENT_STATUSES = new Set(["paid", "partial", "unpaid"]);
const FULFILMENT_STATUSES = new Set(["pending", "fulfilled", "cancelled"]);

/** Validate model-suggested sales fields. Server-side sale validation remains authoritative. */
export function safeSalesDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = {
    productName: cleanString(value.productName, 160),
    unit: cleanString(value.unit, 20),
    quantity: value.quantity === null || value.quantity === undefined ? "" : String(value.quantity).slice(0, 30),
    unitPrice: value.unitPrice === null || value.unitPrice === undefined ? "" : String(value.unitPrice).slice(0, 30),
    saleDate: cleanString(value.saleDate, 40),
    salesChannel: cleanString(value.salesChannel, 20),
    paymentStatus: cleanString(value.paymentStatus, 20),
    amountReceived: value.amountReceived === null || value.amountReceived === undefined ? "" : String(value.amountReceived).slice(0, 30),
    fulfilmentStatus: cleanString(value.fulfilmentStatus, 20),
    buyerIdentityStatus: cleanString(value.buyerIdentityStatus, 20),
    buyerName: cleanString(value.buyerName, 120),
    buyerContact: cleanString(value.buyerContact, 120),
    buyerState: cleanString(value.buyerState, 100),
    buyerArea: cleanString(value.buyerArea, 120),
    saleTime: cleanString(value.saleTime, 5),
    notes: cleanString(value.notes, 1000),
    sourceText: cleanString(value.sourceText, 1000),
  };
  if (draft.unit && !SALE_UNITS.has(draft.unit)) draft.unit = "";
  if (draft.quantity && (!Number.isFinite(Number(draft.quantity)) || Number(draft.quantity) <= 0)) draft.quantity = "";
  if (draft.unitPrice && (!Number.isFinite(Number(draft.unitPrice)) || Number(draft.unitPrice) <= 0)) draft.unitPrice = "";
  if (draft.amountReceived && (!Number.isFinite(Number(draft.amountReceived)) || Number(draft.amountReceived) < 0)) draft.amountReceived = "";
  if (draft.salesChannel && !SALE_CHANNELS.has(draft.salesChannel)) draft.salesChannel = "";
  if (draft.paymentStatus && !PAYMENT_STATUSES.has(draft.paymentStatus)) draft.paymentStatus = "";
  if (draft.fulfilmentStatus && !FULFILMENT_STATUSES.has(draft.fulfilmentStatus)) draft.fulfilmentStatus = "";
  if (draft.buyerIdentityStatus && !["identified", "anonymous", "unknown"].includes(draft.buyerIdentityStatus)) draft.buyerIdentityStatus = "";
  if (draft.saleDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.saleDate) && Number.isNaN(Date.parse(draft.saleDate))) draft.saleDate = "";
  if (draft.saleTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.saleTime)) draft.saleTime = "";
  return draft;
}

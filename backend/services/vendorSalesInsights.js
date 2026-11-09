const PERIOD_DAYS = Object.freeze({ "30d": 30, "90d": 90, "365d": 365, all: null });
export function normalizeInsightsPeriod(value) { return Object.hasOwn(PERIOD_DAYS, value) ? value : "90d"; }
export async function getVendorSalesInsights({ SalesModel, vendorId, period = "90d", now = new Date() }) {
  const selected = normalizeInsightsPeriod(period);
  const days = PERIOD_DAYS[selected];
  const match = { vendorId };
  if (days !== null) match.saleDate = { $gte: new Date(now.getTime() - days * 86_400_000), $lte: now };
  const [facets = {}] = await SalesModel.aggregate([
    { $match: match },
    { $facet: {
      summary: [{ $group: { _id: null, salesCount: { $sum: 1 }, recordedValue: { $sum: "$totalAmount" }, amountReceived: { $sum: "$amountReceived" }, outstandingBalance: { $sum: { $cond: [{ $ne: ["$fulfilmentStatus", "cancelled"] }, { $max: [0, { $subtract: ["$totalAmount", "$amountReceived"] }] }, 0] } }, verifiedValue: { $sum: { $cond: [{ $eq: ["$verificationStatus", "verified"] }, "$totalAmount", 0] } }, unverifiedValue: { $sum: { $cond: [{ $ne: ["$verificationStatus", "verified"] }, "$totalAmount", 0] } } } }],
      products: [{ $group: { _id: { productName: "$productName", unit: "$unit" }, quantity: { $sum: "$quantity" }, recordedValue: { $sum: "$totalAmount" }, salesCount: { $sum: 1 } } }, { $sort: { recordedValue: -1 } }, { $limit: 10 }],
      monthly: [{ $group: { _id: { year: { $year: "$saleDate" }, month: { $month: "$saleDate" } }, recordedValue: { $sum: "$totalAmount" }, salesCount: { $sum: 1 } } }, { $sort: { "_id.year": -1, "_id.month": -1 } }, { $limit: 36 }],
      buyers: [{ $match: { buyerIdentityStatus: "identified", $or: [{ buyerContact: { $ne: "" } }, { buyerName: { $ne: "" } }] } }, { $group: { _id: { $cond: [{ $ne: ["$buyerContact", ""] }, "$buyerContact", "$buyerName"] }, purchases: { $sum: 1 } } }, { $group: { _id: null, identifiedBuyers: { $sum: 1 }, repeatBuyers: { $sum: { $cond: [{ $gte: ["$purchases", 2] }, 1, 0] } } } }],
      payments: [{ $group: { _id: "$paymentStatus", count: { $sum: 1 }, amountReceived: { $sum: "$amountReceived" } } }],
    } },
  ]);
  const summary = facets.summary?.[0] || { salesCount: 0, recordedValue: 0, amountReceived: 0, outstandingBalance: 0, verifiedValue: 0, unverifiedValue: 0 };
  return {
    period: selected,
    summary,
    topProducts: (facets.products || []).map(row => ({ productName: row._id.productName, unit: row._id.unit, quantity: row.quantity, recordedValue: row.recordedValue, salesCount: row.salesCount })),
    monthlyTrend: (facets.monthly || []).map(row => ({ year: row._id.year, month: row._id.month, recordedValue: row.recordedValue, salesCount: row.salesCount })).reverse(),
    buyers: facets.buyers?.[0] || { identifiedBuyers: 0, repeatBuyers: 0 },
    paymentBreakdown: (facets.payments || []).map(row => ({ status: row._id, salesCount: row.count, amountReceived: row.amountReceived })),
  };
}

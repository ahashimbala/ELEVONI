/** Summarise only the sales records explicitly supplied to the assistant. */
export function buildRecentSalesSummary(sales = []) {
  return sales.reduce((summary, sale) => {
    const amount = Number(sale?.totalAmount) || 0;
    summary.recordCount += 1;
    summary.recordedValue += amount;
    if (sale?.verificationStatus === "verified") {
      summary.verifiedCount += 1;
      summary.verifiedValue += amount;
    } else {
      summary.unverifiedCount += 1;
      summary.unverifiedValue += amount;
    }
    return summary;
  }, {
    scope: "up to 12 most recent sales records included in this response",
    currency: "NGN",
    recordCount: 0,
    recordedValue: 0,
    verifiedCount: 0,
    verifiedValue: 0,
    unverifiedCount: 0,
    unverifiedValue: 0,
  });
}

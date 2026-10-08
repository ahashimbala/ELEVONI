import "dotenv/config";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import fishModel from "../models/fishModel.js";

const targetProductName = "Smoked Catfish (1kg)";

const existingBusinessTiers = [
    { minQuantity: 1, maxQuantity: 4, unitPrice: 25000 },
    { minQuantity: 5, maxQuantity: 9, unitPrice: 24000 },
    { minQuantity: 10, maxQuantity: 19, unitPrice: 22500 },
    { minQuantity: 20, maxQuantity: null, unitPrice: 21000 }
];

const migrationProjection = () => ({ name: 1, price: 1, pricingMode: 1, pricingTiers: 1 });

const migrationFilter = () => ({
    name: targetProductName,
    $or: [{ pricingTiers: { $exists: false } }, { pricingTiers: { $size: 0 } }]
});

const migrationUpdate = () => ({
    $set: { pricingTiers: existingBusinessTiers, pricingMode: "tiered" }
});

const describeProduct = (product) => {
    const tiers = Array.isArray(product.pricingTiers) ? product.pricingTiers : [];
    return `${product.name} (price ${product.price}, pricingMode ${product.pricingMode || "absent"}, pricingTiers ${tiers.length})`;
};

const runMigration = async ({ dryRun = false, Model = fishModel, log = console.log } = {}) => {
    const filter = migrationFilter();
    const update = migrationUpdate();
    const matches = await Model.find(filter, migrationProjection());
    if (dryRun) {
        log(`[migration] DRY RUN — would update ${matches.length} product(s) to tiered pricing`);
        for (const product of matches) log(`  would update ${describeProduct(product)}`);
        log(`  would write pricingTiers=[${existingBusinessTiers.map(t => JSON.stringify(t)).join(", ")}] and pricingMode="tiered"`);
        log("[migration] no writes performed (dry run)");
        return { matched: matches.length, modified: 0, dryRun: true };
    }
    const result = await Model.updateMany(filter, update);
    log("[migration] tier backfill complete", { matched: result.matchedCount, modified: result.modifiedCount });
    return { matched: result.matchedCount, modified: result.modifiedCount, dryRun: false };
};

const main = async () => {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
    const dryRun = process.argv.includes("--dry-run");
    try {
        await mongoose.connect(process.env.MONGO_URI);
        await runMigration({ dryRun });
    } finally {
        await mongoose.disconnect();
    }
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    main().catch((error) => {
        console.error("[migration] failed:", error.message);
        process.exitCode = 1;
    });
}

export { targetProductName, existingBusinessTiers, migrationFilter, migrationUpdate, migrationProjection, runMigration };
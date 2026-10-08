import test from "node:test";
import assert from "node:assert/strict";
import { targetProductName, existingBusinessTiers, migrationFilter, migrationUpdate, runMigration } from "../migrations/backfillSmokedCatfishPricingTiers.js";

const seededDoc = (overrides = {}) => ({ _id: "seed-" + Math.random().toString(36).slice(2), name: targetProductName, price: 25000, ...overrides });

const matchesFilter = (doc, filter) => {
    if (filter.name && doc.name !== filter.name) return false;
    return filter.$or.some((clause) => {
        const [path, condition] = Object.entries(clause)[0];
        if (typeof condition === "object" && condition && "$exists" in condition) {
            return condition.$exists === false ? !(path in doc) : path in doc;
        }
        if (typeof condition === "object" && condition && "$size" in condition) {
            return Array.isArray(doc[path]) && doc[path].length === condition.$size;
        }
        return false;
    });
};

const captureCalls = () => {
    const calls = { find: [], updateMany: [] };
    const makeFakeModel = (docs) => ({
        find: async (filter, projection) => {
            calls.find.push({ filter, projection });
            return docs.filter((doc) => matchesFilter(doc, filter));
        },
        updateMany: async (filter, update) => {
            calls.updateMany.push({ filter, update });
            const matched = docs.filter((doc) => matchesFilter(doc, filter));
            for (const doc of matched) {
                if (update?.$set) Object.assign(doc, update.$set);
            }
            return { matchedCount: matched.length, modifiedCount: matched.length };
        }
    });
    return { calls, makeFakeModel };
};

test("migration filter targets the exact product name, not a name regex", () => {
    const filter = migrationFilter();
    assert.equal(filter.name, targetProductName);
    assert.equal(typeof filter.name, "string");
    assert.ok(!filter.name.$regex, "filter must not use a regex on the product name");
});

test("migration filter only matches products with absent or empty pricingTiers", () => {
    const filter = migrationFilter();
    assert.ok(matchesFilter(seededDoc(), filter), "product with absent pricingTiers should match");
    assert.ok(matchesFilter(seededDoc({ pricingTiers: [] }), filter), "product with empty pricingTiers should match");
    assert.ok(!matchesFilter(seededDoc({ pricingTiers: [{ minQuantity: 1, maxQuantity: null, unitPrice: 100 }] }), filter), "product with non-empty pricingTiers must not match");
    assert.ok(!matchesFilter(seededDoc({ name: "Fresh Tilapia" }), filter), "product with a different name must not match");
});

test("migration update writes the tier schedule and tiered mode without touching price", () => {
    const update = migrationUpdate();
    assert.equal(update.$set.pricingMode, "tiered");
    assert.deepEqual(update.$set.pricingTiers, existingBusinessTiers);
    assert.ok(!("price" in update.$set), "migration must not overwrite the base price");
});

test("migration dry run performs no writes", async () => {
    const docs = [seededDoc(), seededDoc({ pricingTiers: [] }), seededDoc({ pricingTiers: [{ minQuantity: 1, maxQuantity: null, unitPrice: 100 }] })];
    const { calls, makeFakeModel } = captureCalls();
    const fakeModel = makeFakeModel(docs);
    const result = await runMigration({ dryRun: true, Model: fakeModel, log: () => {} });

    assert.equal(result.dryRun, true);
    assert.equal(result.matched, 2);
    assert.equal(result.modified, 0);
    assert.equal(calls.find.length, 1, "dry run should still inspect matches");
    assert.equal(calls.updateMany.length, 0, "dry run must never call updateMany");
    for (const doc of docs) {
        assert.ok(!("pricingMode" in doc), "dry run must not mutate documents");
    }
});

test("migration applies tiered pricing only to the target product and never overwrites existing tiers", async () => {
    const existingTiers = [{ minQuantity: 1, maxQuantity: null, unitPrice: 30000 }];
    const targetMissing = seededDoc();
    const targetEmpty = seededDoc({ pricingTiers: [] });
    const targetWithTiers = seededDoc({ pricingTiers: existingTiers });
    const otherProduct = seededDoc({ name: "Fresh Tilapia", price: 5000 });

    const { calls, makeFakeModel } = captureCalls();
    const fakeModel = makeFakeModel([targetMissing, targetEmpty, targetWithTiers, otherProduct]);
    const result = await runMigration({ dryRun: false, Model: fakeModel, log: () => {} });

    assert.equal(result.dryRun, false);
    assert.equal(result.matched, 2);
    assert.equal(result.modified, 2);
    assert.equal(calls.updateMany.length, 1);
    assert.deepEqual(calls.updateMany[0].filter, migrationFilter());
    assert.equal(targetMissing.pricingMode, "tiered");
    assert.deepEqual(targetMissing.pricingTiers, existingBusinessTiers);
    assert.equal(targetEmpty.pricingMode, "tiered");
    assert.deepEqual(targetEmpty.pricingTiers, existingBusinessTiers);
    assert.deepEqual(targetWithTiers.pricingTiers, existingTiers, "non-empty tiers must not be overwritten");
    for (const doc of [targetWithTiers, otherProduct]) {
        assert.ok(!("pricingMode" in doc), "unmatched products must remain unmodified");
    }
    assert.ok(!("pricingTiers" in otherProduct), "other products must not be changed");
});
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";

const baseOrder = (items) => new orderModel({
    userId: "customer-1",
    items,
    amount: 2000,
    address: { street: "1 Market Road" }
});

test("house order items default to no external vendor-profile attribution", async () => {
    const order = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Smoked Catfish",
        sellerType: "house",
        sellerBusinessName: "Elevoni Farms",
        quantity: 1,
        unit: "kg",
        unitPrice: 2000,
        lineTotal: 2000
    }]);

    assert.equal(await order.validate(), undefined);
    assert.equal(order.items[0].vendorId, null);
    assert.equal(order.items[0].vendorBusinessName, "");
    assert.equal(order.items[0].sellerType, "house");
    assert.equal(order.items[0].sellerBusinessName, "Elevoni Farms");
});

test("order items can preserve a marketplace seller snapshot", async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const order = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        vendorId,
        vendorBusinessName: "Green Acres",
        name: "Broiler Chicken",
        quantity: 2,
        unit: "kg",
        unitPrice: 1000,
        lineTotal: 2000
    }]);

    assert.equal(await order.validate(), undefined);
    assert.equal(String(order.items[0].vendorId), String(vendorId));
    assert.equal(order.items[0].vendorBusinessName, "Green Acres");
});


test("new house-catalogue order snapshots identify Elevoni as seller without an external vendor ID", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const fish = { _id: "fish-house-1", name: "Smoked Catfish", price: 25000, pricingMode: "single", pricingTiers: [] };
    const snapshot = await buildOrderSnapshot([{ productId: fish._id, quantity: 1 }], { find: async () => [fish] });
    assert.equal(snapshot.items[0].sellerType, "house");
    assert.equal(snapshot.items[0].sellerBusinessName, "Elevoni Farms");
    assert.equal(snapshot.items[0].vendorId, null);
});


test("one order can attribute separate items to multiple vendors", async () => {
    const firstVendorId = new mongoose.Types.ObjectId();
    const secondVendorId = new mongoose.Types.ObjectId();
    const order = baseOrder([
        {
            productId: new mongoose.Types.ObjectId(),
            vendorId: firstVendorId,
            vendorBusinessName: "Green Acres",
            sellerType: "vendor",
            name: "Broiler Chicken",
            quantity: 2,
            unitPrice: 10000,
            lineTotal: 20000
        },
        {
            productId: new mongoose.Types.ObjectId(),
            vendorId: secondVendorId,
            vendorBusinessName: "Riverbend Farms",
            sellerType: "vendor",
            name: "Fresh Catfish",
            quantity: 3,
            unitPrice: 5000,
            lineTotal: 15000
        }
    ]);

    assert.equal(await order.validate(), undefined);
    assert.equal(String(order.items[0].vendorId), String(firstVendorId));
    assert.equal(String(order.items[1].vendorId), String(secondVendorId));
    assert.notEqual(String(order.items[0].vendorId), String(order.items[1].vendorId));
});

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
        sellerType: "vendor",
        sellerBusinessName: "Green Acres",
        name: "Broiler Chicken",
        quantity: 2,
        unit: "kg",
        unitPrice: 1000,
        lineTotal: 2000
    }]);

    assert.equal(await order.validate(), undefined);
    assert.equal(String(order.items[0].vendorId), String(vendorId));
    assert.equal(order.items[0].vendorBusinessName, "Green Acres");
    assert.equal(order.items[0].sellerBusinessName, "Green Acres");
});


const fakeProductModel = (products) => ({ find: async () => products });
const fakeVendorModel = (vendors) => ({ find: async () => vendors });
const approvedVendor = (vendorId, businessName) => ({ _id: vendorId, businessName, status: "approved" });

test("new house-catalogue order snapshots identify Elevoni as seller without an external vendor ID", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const fish = { _id: "fish-house-1", name: "Smoked Catfish", price: 25000, pricingMode: "single", pricingTiers: [] };
    const snapshot = await buildOrderSnapshot(
        [{
            productId: fish._id,
            quantity: 1,
            // A client must never be able to inject vendor attribution.
            vendorId: new mongoose.Types.ObjectId(),
            vendorBusinessName: "Injected Vendor"
        }],
        fakeProductModel([fish]),
        fakeVendorModel([])
    );
    assert.equal(snapshot.items[0].sellerType, "house");
    assert.equal(snapshot.items[0].sellerBusinessName, "Elevoni Farms");
    assert.equal(snapshot.items[0].vendorId, null);
    assert.equal(snapshot.items[0].vendorBusinessName, "");
});

test("a vendor-owned product resolves its vendor from the product record", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const vendorId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const fish = {
        _id: productId,
        name: "Farm Catfish",
        price: 5000,
        pricingMode: "single",
        pricingTiers: [],
        vendorId
    };
    const snapshot = await buildOrderSnapshot(
        [{ productId, quantity: 2 }],
        fakeProductModel([fish]),
        fakeVendorModel([approvedVendor(vendorId, "Green Acres Farm")])
    );

    assert.equal(String(snapshot.items[0].vendorId), String(vendorId));
    assert.equal(snapshot.items[0].vendorBusinessName, "Green Acres Farm");
    assert.equal(snapshot.items[0].sellerType, "vendor");
    assert.equal(snapshot.items[0].sellerBusinessName, "Green Acres Farm");
});

test("a frontend-supplied vendor ID cannot override the product owner", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const actualVendorId = new mongoose.Types.ObjectId();
    const injectedVendorId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const fish = {
        _id: productId,
        name: "Farm Catfish",
        price: 5000,
        pricingMode: "single",
        pricingTiers: [],
        vendorId: actualVendorId
    };
    const snapshot = await buildOrderSnapshot(
        [{
            productId,
            quantity: 1,
            vendorId: injectedVendorId,
            vendorBusinessName: "Injected Vendor"
        }],
        fakeProductModel([fish]),
        fakeVendorModel([approvedVendor(actualVendorId, "Actual Owner Farm")])
    );

    assert.equal(String(snapshot.items[0].vendorId), String(actualVendorId));
    assert.notEqual(String(snapshot.items[0].vendorId), String(injectedVendorId));
    assert.equal(snapshot.items[0].vendorBusinessName, "Actual Owner Farm");
});

test("an order item cannot be created without a valid vendor relationship", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const vendorId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const fish = {
        _id: productId,
        name: "Farm Catfish",
        price: 5000,
        pricingMode: "single",
        pricingTiers: [],
        vendorId
    };

    await assert.rejects(
        buildOrderSnapshot(
            [{ productId, quantity: 1 }],
            fakeProductModel([fish]),
            fakeVendorModel([])
        ),
        /no valid vendor attribution/i
    );

    await assert.rejects(
        buildOrderSnapshot(
            [{ productId, quantity: 1 }],
            fakeProductModel([fish]),
            fakeVendorModel([{ _id: vendorId, businessName: "Pending Farm", status: "pending" }])
        ),
        /no valid vendor attribution/i
    );

    await assert.rejects(
        buildOrderSnapshot(
            [{ productId, quantity: 1 }],
            fakeProductModel([{ ...fish, vendorId: "not-a-valid-id" }]),
            fakeVendorModel([])
        ),
        /invalid vendor relationship/i
    );
});

test("multiple vendor-owned items in one snapshot keep separate attribution", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const firstVendorId = new mongoose.Types.ObjectId();
    const secondVendorId = new mongoose.Types.ObjectId();
    const firstProductId = new mongoose.Types.ObjectId();
    const secondProductId = new mongoose.Types.ObjectId();
    const products = [
        { _id: firstProductId, name: "Broiler Chicken", price: 10000, pricingMode: "single", pricingTiers: [], vendorId: firstVendorId },
        { _id: secondProductId, name: "Fresh Catfish", price: 5000, pricingMode: "single", pricingTiers: [], vendorId: secondVendorId }
    ];
    const snapshot = await buildOrderSnapshot(
        [
            { productId: firstProductId, quantity: 2 },
            { productId: secondProductId, quantity: 3 }
        ],
        fakeProductModel(products),
        fakeVendorModel([
            approvedVendor(firstVendorId, "Green Acres"),
            approvedVendor(secondVendorId, "Riverbend Farms")
        ])
    );

    assert.equal(String(snapshot.items[0].vendorId), String(firstVendorId));
    assert.equal(snapshot.items[0].vendorBusinessName, "Green Acres");
    assert.equal(String(snapshot.items[1].vendorId), String(secondVendorId));
    assert.equal(snapshot.items[1].vendorBusinessName, "Riverbend Farms");
});

test("the order model stores the vendor snapshot for vendor-owned items", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const vendorId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const fish = { _id: productId, name: "Farm Catfish", price: 5000, pricingMode: "single", pricingTiers: [], vendorId };
    const snapshot = await buildOrderSnapshot(
        [{ productId, quantity: 1 }],
        fakeProductModel([fish]),
        fakeVendorModel([approvedVendor(vendorId, "Green Acres Farm")])
    );

    const order = baseOrder(snapshot.items);
    assert.equal(await order.validate(), undefined);
    assert.equal(String(order.items[0].vendorId), String(vendorId));
    assert.equal(order.items[0].vendorBusinessName, "Green Acres Farm");
});

test("vendor-owned order items require both attribution fields", async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const missingVendor = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Farm Catfish",
        sellerType: "vendor",
        vendorBusinessName: "Green Acres",
        sellerBusinessName: "Green Acres",
        quantity: 1
    }]);
    await assert.rejects(missingVendor.validate(), /vendor profile/i);

    const missingName = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Farm Catfish",
        sellerType: "vendor",
        vendorId,
        sellerBusinessName: "Green Acres",
        quantity: 1
    }]);
    await assert.rejects(missingName.validate(), /vendor business name/i);
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
            sellerBusinessName: "Green Acres",
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
            sellerBusinessName: "Riverbend Farms",
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

test("house-owned order items reject vendor attribution", async () => {
    const withVendor = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Smoked Catfish",
        sellerType: "house",
        sellerBusinessName: "Elevoni Farms",
        vendorId: new mongoose.Types.ObjectId(),
        quantity: 1
    }]);
    await assert.rejects(withVendor.validate(), /must not reference a vendor profile/i);

    const withVendorName = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Smoked Catfish",
        sellerType: "house",
        sellerBusinessName: "Elevoni Farms",
        vendorBusinessName: "Green Acres",
        quantity: 1
    }]);
    await assert.rejects(withVendorName.validate(), /must not carry a vendor business name/i);
});

test("vendor-owned order items require a matching seller business name", async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const missingSellerName = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Farm Catfish",
        sellerType: "vendor",
        vendorId,
        vendorBusinessName: "Green Acres",
        quantity: 1
    }]);
    await assert.rejects(missingSellerName.validate(), /seller business name/i);

    const mismatchedSellerName = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Farm Catfish",
        sellerType: "vendor",
        vendorId,
        vendorBusinessName: "Green Acres",
        sellerBusinessName: "Another Farm",
        quantity: 1
    }]);
    await assert.rejects(mismatchedSellerName.validate(), /must use the vendor business name/i);
});

test("new order items cannot keep the unknown seller type", async () => {
    const order = baseOrder([{
        productId: new mongoose.Types.ObjectId(),
        name: "Farm Catfish",
        quantity: 1
    }]);

    await assert.rejects(order.validate(), /must be attributed to Elevoni or an external vendor/i);
});

test("deleted vendor profiles are rejected instead of treated as house items", async () => {
    const { buildOrderSnapshot } = await import("../controllers/orderPricing.js");
    const vendorId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const product = {
        _id: productId,
        name: "Farm Catfish",
        price: 5000,
        pricingMode: "single",
        pricingTiers: [],
        vendorId
    };

    await assert.rejects(
        buildOrderSnapshot([{ productId, quantity: 1 }], fakeProductModel([product]), fakeVendorModel([])),
        /no valid vendor attribution/i
    );

    const populatedButDeleted = {
        ...product,
        vendorId: null,
        populated: (path) => (path === "vendorId" ? vendorId : undefined)
    };
    await assert.rejects(
        buildOrderSnapshot([{ productId, quantity: 1 }], fakeProductModel([populatedButDeleted]), fakeVendorModel([])),
        /no valid vendor attribution/i
    );
});

test("seller attribution snapshot fields are immutable", () => {
    for (const path of [
        "items.vendorId",
        "items.vendorBusinessName",
        "items.sellerType",
        "items.sellerBusinessName"
    ]) {
        assert.equal(orderModel.schema.path(path).options.immutable, true);
    }
});

test("seller attribution snapshots cannot be changed after creation", () => {
    const vendorId = new mongoose.Types.ObjectId();
    const order = orderModel.hydrate({
        _id: new mongoose.Types.ObjectId(),
        userId: "customer-1",
        amount: 1000,
        address: { street: "1 Market Road" },
        items: [{
            productId: new mongoose.Types.ObjectId(),
            name: "Farm Catfish",
            quantity: 1,
            unit: "kg",
            unitPrice: 1000,
            lineTotal: 1000,
            sellerType: "vendor",
            sellerBusinessName: "Green Acres",
            vendorId,
            vendorBusinessName: "Green Acres"
        }]
    });

    order.items[0].sellerType = "house";
    order.items[0].sellerBusinessName = "Elevoni Farms";
    order.items[0].vendorId = null;
    order.items[0].vendorBusinessName = "";

    assert.equal(order.items[0].sellerType, "vendor");
    assert.equal(order.items[0].sellerBusinessName, "Green Acres");
    assert.equal(String(order.items[0].vendorId), String(vendorId));
    assert.equal(order.items[0].vendorBusinessName, "Green Acres");
});

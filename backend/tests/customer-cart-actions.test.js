import test from "node:test";
import assert from "node:assert/strict";
import {
  inferCustomerCartRequest,
  matchDirectCatalogueProduct,
  resolveCartQuantity,
} from "../services/nAtlasCustomerCart.js";

const catalogue = [
  { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", name: "Smoked Catfish", description: "Oven dried smoked catfish" },
  { _id: "bbbbbbbbbbbbbbbbbbbbbbbb", name: "Fresh Catfish", description: "Fresh farmed catfish" },
];

test("infers a five-kilogram smoked catfish cart request even when the model omits the action fields", () => {
  const request = inferCustomerCartRequest({ action: "none", productName: "", quantity: null, unit: "" }, "I want 5 kilos of smoked catfish");
  assert.equal(request.action, "set_quantity");
  assert.equal(request.productName, "smoked catfish");
  assert.equal(request.quantity, 5);
  assert.equal(request.unit, "kg");
});

test("recognises view cart and checkout requests", () => {
  assert.equal(inferCustomerCartRequest({}, "Please show my cart").action, "view_cart");
  assert.equal(inferCustomerCartRequest({}, "Take me to checkout").action, "checkout");
});

test("matches the exact direct catalogue product", () => {
  const result = matchDirectCatalogueProduct(catalogue, "smoked catfish");
  assert.equal(result.product?._id, "aaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(result.ambiguous, false);
});

test("does not guess between equally matching catalogue products", () => {
  const result = matchDirectCatalogueProduct(catalogue, "catfish");
  assert.equal(result.product, null);
  assert.equal(result.ambiguous, true);
});

test("sets a requested absolute cart quantity", () => {
  assert.deepEqual(resolveCartQuantity({ action: "set_quantity", requestedQuantity: 5, currentQuantity: 2, unit: "kg" }), { ok: true, quantity: 5 });
});

test("increments and decrements cart quantities safely", () => {
  assert.deepEqual(resolveCartQuantity({ action: "add_quantity", requestedQuantity: 2, currentQuantity: 3, unit: "kg" }), { ok: true, quantity: 5 });
  assert.deepEqual(resolveCartQuantity({ action: "subtract_quantity", requestedQuantity: 2, currentQuantity: 3, unit: "kg" }), { ok: true, quantity: 1 });
});

test("rejects fractional, unsupported-unit and over-limit cart quantities", () => {
  assert.equal(resolveCartQuantity({ action: "set_quantity", requestedQuantity: 0.5, unit: "kg" }).reason, "quantity");
  assert.equal(resolveCartQuantity({ action: "set_quantity", requestedQuantity: 2, unit: "pieces" }).reason, "unit");
  assert.equal(resolveCartQuantity({ action: "set_quantity", requestedQuantity: 501, unit: "kg" }).reason, "quantity");
});

test("structured cart actions are language-agnostic when the model has understood the user's language", () => {
  for (const message of ["I want 5 kg smoked catfish", "Abeg put 5kg smoked catfish for my cart", "[Hausa request for five kg smoked catfish]", "[Igbo request for five kg smoked catfish]", "[Yoruba request for five kg smoked catfish]"]) {
    const request = inferCustomerCartRequest({ action: "set_quantity", productName: "Smoked Catfish", quantity: 5, unit: "kg" }, message);
    assert.equal(request.action, "set_quantity");
    assert.equal(request.productName, "Smoked Catfish");
    assert.equal(request.quantity, 5);
    assert.equal(request.unit, "kg");
  }
});

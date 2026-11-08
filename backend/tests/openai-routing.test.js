import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

test("live customer and vendor assistant routes are not attached to the N-ATLaS 1,000-user gate", async () => {
  const [vendorRoute, customerRoute, vendorController, customerController] = await Promise.all([
    read("routes/nAtlasRoute.js"), read("routes/nAtlasCustomerRoute.js"),
    read("controllers/nAtlasController.js"), read("controllers/nAtlasCustomerController.js"),
  ]);
  for (const source of [vendorRoute, customerRoute, vendorController, customerController]) {
    assert.doesNotMatch(source, /prepareNAtlasIdentity|admitNAtlasRequest/);
  }
});

test("provider-neutral OpenAI routes are mounted while legacy route aliases remain available", async () => {
  const server = await read("server.js");
  assert.match(server, /app\.use\("\/api\/assistant\/customer", nAtlasCustomerRouter\)/);
  assert.match(server, /app\.use\("\/api\/assistant\/vendor", nAtlasRouter\)/);
  assert.match(server, /app\.use\("\/api\/n-atlas\/customer", nAtlasCustomerRouter\)/);
  assert.match(server, /app\.use\("\/api\/n-atlas", nAtlasRouter\)/);
});

test("the N-ATLaS SDK is no longer a backend dependency", async () => {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const packageLock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
  assert.equal(packageJson.dependencies?.["n-atlas"], undefined);
  assert.equal(packageLock.packages?.["node_modules/n-atlas"], undefined);
});

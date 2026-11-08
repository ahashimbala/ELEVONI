import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

test("both customer and vendor chat endpoints consume the shared daily prompt quota", async () => {
  const [vendor, customer] = await Promise.all([
    read("controllers/nAtlasController.js"),
    read("controllers/nAtlasCustomerController.js"),
  ]);
  assert.match(vendor, /consumeAssistantPrompt\(req, "vendor"\)/);
  assert.match(customer, /consumeAssistantPrompt\(req, "customer"\)/);
  assert.match(vendor, /checkAssistantDailyQuota\(req\)/);
  assert.match(customer, /checkAssistantDailyQuota\(req\)/);
});

test("browser clients send a persistent anonymous visitor ID and CORS accepts it", async () => {
  const [customer, vendor, cors, helper] = await Promise.all([
    read("../frontend/src/pages/ElevoniAssistant/ElevoniAssistant.jsx"),
    read("../vendor-portal/src/api.js"),
    read("middleware/apiCors.js"),
    read("../shared/assistantVisitor.mjs"),
  ]);
  assert.match(customer, /X-Elevoni-Visitor-ID/);
  assert.match(vendor, /X-Elevoni-Visitor-ID/);
  assert.match(cors, /X-Elevoni-Visitor-ID/);
  assert.match(helper, /elevoni-assistant-visitor-id/);
});

test("visitor IDs remain stable for anonymous storefront sessions", async () => {
  const { getAssistantVisitorId, VISITOR_STORAGE_KEY } = await import("../../shared/assistantVisitor.mjs");
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const cryptoApi = { randomUUID: () => "b2c1a2d3-e4f5-4678-9abc-123456789abc" };
  const first = getAssistantVisitorId({ storage, cryptoApi });
  const second = getAssistantVisitorId({ storage, cryptoApi: { randomUUID: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } });
  assert.equal(first, second);
  assert.equal(values.get(VISITOR_STORAGE_KEY), first);
});

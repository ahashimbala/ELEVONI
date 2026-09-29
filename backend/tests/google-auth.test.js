import test from "node:test";
import assert from "node:assert/strict";
import { createGoogleIdentityVerifier } from "../services/googleIdentityService.js";

const makeVerifier = (payload) => createGoogleIdentityVerifier({
    verifyIdToken: async (options) => ({ getPayload: () => { assert.equal(options.audience, "client-id"); return payload; } })
});

test("Google ID token claims return normalized verified identity", async () => {
    const verify = makeVerifier({ sub: "google-sub", email: "Buyer@Example.com", email_verified: true, name: "Buyer" });
    assert.deepEqual(await verify("signed-token", "client-id"), {
        sub: "google-sub", email: "buyer@example.com", name: "Buyer"
    });
});

test("Google identity verifier requires a configured audience", async () => {
    const verify = makeVerifier({});
    await assert.rejects(verify("signed-token", ""), { code: "GOOGLE_CONFIG_MISSING" });
});

test("Google identity verifier rejects identities without a verified email", async () => {
    const verify = makeVerifier({ sub: "google-sub", email: "buyer@example.com", email_verified: false });
    await assert.rejects(verify("signed-token", "client-id"), { code: "GOOGLE_TOKEN_INVALID" });
});

test("Google verification errors are normalized as invalid credentials", async () => {
    const verify = createGoogleIdentityVerifier({ verifyIdToken: async () => { throw new Error("token expired"); } });
    await assert.rejects(verify("expired-token", "client-id"), { code: "GOOGLE_TOKEN_INVALID" });
});
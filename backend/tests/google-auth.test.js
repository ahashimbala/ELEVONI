import test from "node:test";
import assert from "node:assert/strict";
import { createGoogleIdentityVerifier } from "../services/googleIdentityService.js";
import { OAuth2Client } from "google-auth-library";
import userModel from "../models/userModel.js";
import { googleLogin } from "../controllers/userController.js";

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


const runGoogleLogin = async ({ body, googleUser = null, emailUser = null }) => {
    const originalVerify = OAuth2Client.prototype.verifyIdToken;
    const originalFindOne = userModel.findOne;
    const originalFind = userModel.find;
    const originalSave = userModel.prototype.save;
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalJwtSecret = process.env.JWT_SECRET;
    const saved = [];
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.JWT_SECRET = "test-jwt-secret";
    OAuth2Client.prototype.verifyIdToken = async () => ({
        getPayload: () => ({
            sub: "google-sub",
            email: "buyer@example.com",
            email_verified: true,
            name: "Buyer"
        })
    });
    userModel.findOne = async (filter) => filter.googleId ? googleUser : null;
    userModel.find = () => ({ limit: async () => emailUser ? [emailUser] : [] });
    userModel.prototype.save = async function () {
        saved.push(this);
        return this;
    };
    const response = {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; return this; }
    };
    try {
        await googleLogin({ body: { credential: "verified-google-id-token-value", ...body } }, response);
        return { ...response, saved };
    } finally {
        OAuth2Client.prototype.verifyIdToken = originalVerify;
        userModel.findOne = originalFindOne;
        userModel.find = originalFind;
        userModel.prototype.save = originalSave;
        if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
        else process.env.GOOGLE_CLIENT_ID = originalClientId;
        if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = originalJwtSecret;
    }
};

test("existing Google customer can sign in without new-account consent", async () => {
    const user = { _id: "customer-1", name: "Buyer", email: "buyer@example.com", role: "customer", googleId: "google-sub" };
    const result = await runGoogleLogin({ body: { intent: "sign_in", consentAccepted: false }, googleUser: user });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.success, true);
    assert.ok(result.body.token);
});

test("existing email/password customer is linked and authenticated as an existing account", async () => {
    const user = {
        _id: "customer-2", name: "Buyer", email: "buyer@example.com", role: "customer",
        password: "existing-password-hash", googleId: null, save: async () => user
    };
    const result = await runGoogleLogin({ body: { intent: "sign_up", consentAccepted: false }, emailUser: user });
    assert.equal(result.statusCode, 200);
    assert.equal(user.googleId, "google-sub");
    assert.equal(result.saved.length, 0);
});

test("new Google signup without consent is rejected before user creation", async () => {
    const result = await runGoogleLogin({ body: { intent: "sign_up", consentAccepted: false } });
    assert.equal(result.statusCode, 428);
    assert.equal(result.body.code, "CONSENT_REQUIRED");
    assert.equal(result.saved.length, 0);
});

test("new Google signup with consent creates a customer and issues the Elevoni JWT", async () => {
    const result = await runGoogleLogin({ body: { intent: "sign_up", consentAccepted: true } });
    assert.equal(result.statusCode, 201);
    assert.equal(result.body.success, true);
    assert.ok(result.body.token);
    assert.equal(result.saved.length, 1);
    assert.equal(result.saved[0].role, "customer");
});

test("Google sign-in does not create an account when no Elevoni account exists", async () => {
    const result = await runGoogleLogin({ body: { intent: "sign_in", consentAccepted: true } });
    assert.equal(result.statusCode, 404);
    assert.equal(result.body.code, "ACCOUNT_NOT_FOUND");
    assert.equal(result.saved.length, 0);
});

test("Google cannot authenticate an existing admin account", async () => {
    const user = { _id: "admin-1", name: "Admin", email: "buyer@example.com", role: "admin", googleId: "google-sub" };
    const result = await runGoogleLogin({ body: { intent: "sign_in", consentAccepted: false }, googleUser: user });
    assert.equal(result.statusCode, 403);
    assert.equal(result.body.success, false);
});

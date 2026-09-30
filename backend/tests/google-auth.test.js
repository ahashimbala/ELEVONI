import test from "node:test";
import assert from "node:assert/strict";
import { createGoogleIdentityVerifier } from "../services/googleIdentityService.js";
import { OAuth2Client } from "google-auth-library";
import userModel from "../models/userModel.js";
import googleSignupContinuationModel from "../models/GoogleSignupContinuation.js";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { completeGoogleSignup, googleLogin } from "../controllers/userController.js";

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


const runGoogleLogin = async ({ body, googleUser = null, emailUser = null, redirect = false, cookieToken = "csrf-value", verifyFailure = null }) => {
    const originalVerify = OAuth2Client.prototype.verifyIdToken;
    const originalFindOne = userModel.findOne;
    const originalFind = userModel.find;
    const originalSave = userModel.prototype.save;
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalJwtSecret = process.env.JWT_SECRET;
    const originalContinuationCreate = googleSignupContinuationModel.create;
    const createdContinuations = [];
    const saved = [];
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.JWT_SECRET = "test-jwt-secret";
    OAuth2Client.prototype.verifyIdToken = async () => {
        if (verifyFailure) throw verifyFailure;
        return ({
        getPayload: () => ({
            sub: "google-sub",
            email: "buyer@example.com",
            email_verified: true,
            name: "Buyer"
        })
    });
    };
    googleSignupContinuationModel.create = async (record) => { createdContinuations.push(record); return record; };
    userModel.findOne = async (filter) => filter.googleId ? googleUser : null;
    userModel.find = () => ({ limit: async () => emailUser ? [emailUser] : [] });
    userModel.prototype.save = async function () {
        saved.push(this);
        return this;
    };
    const response = {
        statusCode: 200,
        body: null,
        location: null,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; return this; },
        redirect(code, location) { this.statusCode = code; this.location = location; return this; }
    };
    const request = {
        body: { credential: "verified-google-id-token-value", ...body },
        headers: { cookie: cookieToken ? `g_csrf_token=${cookieToken}` : "" },
        is: (type) => redirect && type === "application/x-www-form-urlencoded"
    };
    try {
        await googleLogin(request, response);
        return { ...response, saved, createdContinuations };
    } finally {
        OAuth2Client.prototype.verifyIdToken = originalVerify;
        userModel.findOne = originalFindOne;
        userModel.find = originalFind;
        userModel.prototype.save = originalSave;
        googleSignupContinuationModel.create = originalContinuationCreate;
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

test("GIS redirect success returns the Elevoni JWT to an allowed app origin in a fragment", async () => {
    const user = { _id: "customer-redirect", name: "Buyer", email: "buyer@example.com", role: "customer", googleId: "google-sub" };
    const result = await runGoogleLogin({
        redirect: true,
        body: { state: "sign_in|https://elevonifarms.vercel.app", g_csrf_token: "csrf-value" },
        googleUser: user
    });
    assert.equal(result.statusCode, 303);
    const target = new URL(result.location);
    assert.equal(target.origin, "https://elevonifarms.vercel.app");
    assert.ok(new URLSearchParams(target.hash.slice(1)).get("elevoni_google_token"));
});

test("GIS redirect new signup without consent returns only an opaque continuation and creates no user", async () => {
    const result = await runGoogleLogin({
        redirect: true,
        body: { state: "sign_up_unconsented|https://elevonifarms.vercel.app", g_csrf_token: "csrf-value" }
    });
    assert.equal(result.statusCode, 303);
    const target = new URL(result.location);
    const reference = new URLSearchParams(target.hash.slice(1)).get("elevoni_google_signup");
    assert.equal(target.searchParams.has("google_auth_error"), false);
    assert.equal(typeof reference, "string");
    assert.equal(reference.length, 43);
    assert.equal(result.saved.length, 0);
    assert.equal(result.createdContinuations.length, 1);
    assert.notEqual(result.createdContinuations[0].referenceHash, reference);
    assert.equal(target.toString().includes("verified-google-id-token-value"), false);
});
test("GIS redirect rejects a mismatched double-submit CSRF token", async () => {
    const result = await runGoogleLogin({
        redirect: true,
        cookieToken: "different-cookie",
        body: { state: "sign_up_consented|https://elevonifarms.vercel.app", g_csrf_token: "csrf-value" }
    });
    assert.equal(result.statusCode, 303);
    assert.equal(new URL(result.location).searchParams.get("google_auth_error"), "GOOGLE_AUTH_FAILED");
    assert.equal(result.saved.length, 0);
});

test("Google verification failure never creates a signup continuation", async () => {
    const result = await runGoogleLogin({
        redirect: true,
        verifyFailure: new Error("signature rejected"),
        body: { state: "sign_up_unconsented|https://elevonifarms.vercel.app", g_csrf_token: "csrf-value" }
    });
    assert.equal(result.createdContinuations.length, 0);
    assert.equal(result.saved.length, 0);
});

const makePendingContinuation = (reference = "a".repeat(43), expiresAt = new Date(Date.now() + 5 * 60 * 1000)) => ({
    reference,
    record: {
        referenceHash: createHash("sha256").update(reference).digest("hex"),
        purpose: "google_signup_consent",
        googleId: "google-sub",
        email: "buyer@example.com",
        name: "Buyer",
        expiresAt
    }
});

const runGoogleSignupCompletion = async ({
    pending = null,
    continuation = "a".repeat(43),
    consentAccepted = true,
    googleUser = null,
    emailUser = null,
    repeat = false
} = {}) => {
    const originalFindOne = userModel.findOne;
    const originalFind = userModel.find;
    const originalSave = userModel.prototype.save;
    const originalFindOneAndDelete = googleSignupContinuationModel.findOneAndDelete;
    const originalJwtSecret = process.env.JWT_SECRET;
    const saved = [];
    let available = pending;
    process.env.JWT_SECRET = "test-jwt-secret";
    userModel.findOne = async (filter) => filter.googleId ? googleUser : null;
    userModel.find = () => ({ limit: async () => emailUser ? [emailUser] : [] });
    userModel.prototype.save = async function () { saved.push(this); return this; };
    googleSignupContinuationModel.findOneAndDelete = async ({ referenceHash }) => {
        if (available?.referenceHash === referenceHash) {
            const consumed = available;
            available = null;
            return consumed;
        }
        return null;
    };
    const invoke = async () => {
        const response = {
            statusCode: 200,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(value) { this.body = value; return this; }
        };
        await completeGoogleSignup({ body: { continuation, consentAccepted } }, response);
        return response;
    };
    try {
        const first = await invoke();
        const second = repeat ? await invoke() : null;
        return { first, second, saved, pending: available };
    } finally {
        userModel.findOne = originalFindOne;
        userModel.find = originalFind;
        userModel.prototype.save = originalSave;
        googleSignupContinuationModel.findOneAndDelete = originalFindOneAndDelete;
        if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = originalJwtSecret;
    }
};

test("invalid continuation is rejected", async () => {
    const result = await runGoogleSignupCompletion({ continuation: "x".repeat(43) });
    assert.equal(result.first.statusCode, 410);
    assert.equal(result.saved.length, 0);
});

test("expired continuation is rejected and consumed", async () => {
    const { reference, record } = makePendingContinuation("e".repeat(43), new Date(Date.now() - 1));
    const result = await runGoogleSignupCompletion({ continuation: reference, pending: record });
    assert.equal(result.first.statusCode, 410);
    assert.equal(result.pending, null);
});

test("continuation is single-use, including repeated successful requests", async () => {
    const { reference, record } = makePendingContinuation("r".repeat(43));
    const result = await runGoogleSignupCompletion({ continuation: reference, pending: record, repeat: true });
    assert.equal(result.first.statusCode, 201);
    assert.equal(result.second.statusCode, 410);
    assert.equal(result.saved.length, 1);
});

test("opaque continuation cannot be used as an Elevoni JWT", () => {
    const { reference } = makePendingContinuation();
    assert.throws(() => jwt.verify(reference, "test-jwt-secret"));
});

test("accepted continuation creates a customer and returns the normal Elevoni JWT", async () => {
    const { reference, record } = makePendingContinuation("c".repeat(43));
    const result = await runGoogleSignupCompletion({ continuation: reference, pending: record });
    assert.equal(result.first.statusCode, 201);
    assert.equal(result.first.body.success, true);
    assert.equal(result.saved.length, 1);
    assert.equal(result.saved[0].role, "customer");
    const decoded = jwt.verify(result.first.body.token, "test-jwt-secret");
    assert.equal(decoded.role, "customer");
    assert.equal(decoded.id, result.saved[0]._id.toString());
});

test("existing email customer is linked rather than duplicated during continuation completion", async () => {
    const { reference, record } = makePendingContinuation("l".repeat(43));
    const existing = {
        _id: "existing-customer",
        name: "Buyer",
        email: "buyer@example.com",
        role: "customer",
        googleId: null,
        save: async () => existing
    };
    const result = await runGoogleSignupCompletion({ continuation: reference, pending: record, emailUser: existing });
    assert.equal(result.first.statusCode, 201);
    assert.equal(existing.googleId, "google-sub");
    assert.equal(result.saved.length, 0);
});

test("admin account is neither linked nor created by Google continuation", async () => {
    const { reference, record } = makePendingContinuation("d".repeat(43));
    const admin = { _id: "admin-id", name: "Admin", email: "buyer@example.com", role: "admin", googleId: null };
    const result = await runGoogleSignupCompletion({ continuation: reference, pending: record, emailUser: admin });
    assert.equal(result.first.statusCode, 409);
    assert.equal(result.saved.length, 0);
});

test("failed consent attempt consumes the continuation", async () => {
    const { reference, record } = makePendingContinuation("f".repeat(43));
    const result = await runGoogleSignupCompletion({ continuation: reference, pending: record, consentAccepted: false, repeat: true });
    assert.equal(result.first.statusCode, 428);
    assert.equal(result.second.statusCode, 410);
});

test("popup Google signup still accepts consent and returns the normal token without a continuation", async () => {
    const result = await runGoogleLogin({ body: { intent: "sign_up", consentAccepted: true } });
    assert.equal(result.statusCode, 201);
    assert.ok(result.body.token);
    assert.equal(result.createdContinuations.length, 0);
    assert.equal(result.saved[0].role, "customer");
});

test("Safari redirect continuation completes signup through the dedicated endpoint", async () => {
    const redirect = await runGoogleLogin({
        redirect: true,
        body: { state: "sign_up_unconsented|https://elevonifarms.vercel.app", g_csrf_token: "csrf-value" }
    });
    const reference = new URLSearchParams(new URL(redirect.location).hash.slice(1)).get("elevoni_google_signup");
    const result = await runGoogleSignupCompletion({
        continuation: reference,
        pending: redirect.createdContinuations[0]
    });
    assert.equal(result.first.statusCode, 201);
    assert.ok(result.first.body.token);
    assert.equal(result.saved[0].role, "customer");
});

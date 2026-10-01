import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import apiCorsGate from "../middleware/apiCors.js";

const createServer = async () => {
    const app = express();
    app.use(apiCorsGate);
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.post("/api/user/google", (req, res) => res.status(200).json({ received: req.body.credential }));
    app.post("/api/cart/get", (req, res) => res.status(200).json({ ok: true }));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    return server;
};

const closeServer = (server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
});

test("Google GIS form callback bypasses CORS regardless of Origin", async (t) => {
    const server = await createServer();
    t.after(() => closeServer(server));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/user/google`, {
        method: "POST",
        headers: {
            Origin: "https://unlisted-origin.example",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "credential=test-google-credential"
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { received: "test-google-credential" });
    assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("normal API POSTs still reject arbitrary origins", async (t) => {
    const server = await createServer();
    t.after(() => closeServer(server));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/cart/get`, {
        method: "POST",
        headers: {
            Origin: "https://unlisted-origin.example",
            "Content-Type": "application/json"
        },
        body: "{}"
    });

    assert.equal(response.status, 500);
    assert.match(await response.text(), /Not allowed by CORS/);
});

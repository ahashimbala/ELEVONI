import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { verifyGoogleIdToken } from "../services/googleIdentityService.js";

const createToken = (user) => jwt.sign(
    { id: user._id.toString(), role: user.role || "customer" },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "24h" }
);

const safeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || "customer"
});

const findByVerifiedEmail = async (email) => {
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = await userModel.find({ email: new RegExp(`^${escapedEmail}$`, "i") }).limit(2);
    if (matches.length > 1) {
        const error = new Error("Multiple Elevoni accounts match the verified Google email");
        error.code = "GOOGLE_EMAIL_AMBIGUOUS";
        throw error;
    }
    return matches[0] || null;
};
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        return res.json({ success: true, token: createToken(user), user: safeUser(user) });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Unable to log in" });
    }
};

const registerUser = async (req, res) => {
    const { name, password, email } = req.body;
    try {
        if (!name || typeof name !== "string" || !password || typeof password !== "string" || !email) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required" });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password" });
        }
        if (await userModel.findOne({ email })) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const user = await new userModel({ name, email, password: hashedPassword, role: "customer" }).save();
        return res.status(201).json({ success: true, token: createToken(user), user: safeUser(user) });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(error?.code === 11000 ? 409 : 500).json({
            success: false,
            message: error?.code === 11000 ? "User already exists" : "Unable to register"
        });
    }
};

const googleReturnOrigins = new Set([
    "https://elevonifarms.vercel.app",
    "https://elevonifarms-git-main-elevoni.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
]);

const parseGoogleRedirectState = (state) => {
    const [flow, origin] = typeof state === "string" ? state.split("|") : [];
    const validOrigin = googleReturnOrigins.has(origin) ? origin : null;
    if (flow === "sign_in") return { intent: "sign_in", consentAccepted: false, origin: validOrigin };
    if (flow === "sign_up_consented") return { intent: "sign_up", consentAccepted: true, origin: validOrigin };
    if (flow === "sign_up_unconsented") return { intent: "sign_up", consentAccepted: false, origin: validOrigin };
    return { intent: null, consentAccepted: false, origin: validOrigin };
};

const redirectGoogleOutcome = (res, origin, { token, code, intent }) => {
    const destination = new URL(origin);
    if (token) {
        destination.hash = new URLSearchParams({ elevoni_google_token: token }).toString();
    } else {
        destination.searchParams.set("google_auth_error", code || "GOOGLE_AUTH_FAILED");
        destination.searchParams.set("google_auth_intent", intent || "sign_in");
    }
    return res.redirect(303, destination.toString());
};

const googleLogin = async (req, res) => {
    const isRedirectRequest = req.is("application/x-www-form-urlencoded");
    const redirectState = isRedirectRequest ? parseGoogleRedirectState(req.body?.state) : null;
    const returnOrigin = redirectState?.origin || "https://elevonifarms.vercel.app";
    let statusCode = 200;
    const response = isRedirectRequest ? {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            if (body.success && body.token) {
                return redirectGoogleOutcome(res, returnOrigin, { token: body.token });
            }
            const code = body.code || (
                statusCode === 403 ? "ACCOUNT_NOT_ALLOWED" :
                statusCode === 409 ? "ACCOUNT_CONFLICT" :
                "GOOGLE_AUTH_FAILED"
            );
            return redirectGoogleOutcome(res, returnOrigin, { code, intent });
        }
    } : res;

    let intent;
    let consentAccepted;
    if (isRedirectRequest) {
        const cookieToken = (req.headers.cookie || "")
            .split(";")
            .map((part) => part.trim())
            .find((part) => part.startsWith("g_csrf_token="))
            ?.slice("g_csrf_token=".length);
        const bodyToken = req.body?.g_csrf_token;
        const csrfMatches = typeof cookieToken === "string" &&
            typeof bodyToken === "string" &&
            cookieToken.length > 0 &&
            cookieToken === bodyToken;

        intent = redirectState?.intent;
        consentAccepted = redirectState?.consentAccepted;
        if (!csrfMatches || !intent) {
            return redirectGoogleOutcome(res, returnOrigin, {
                code: "GOOGLE_AUTH_FAILED",
                intent: intent || "sign_in"
            });
        }
    } else {
        ({ intent, consentAccepted } = req.body || {});
    }

    const { credential } = req.body || {};
    if (typeof credential !== "string" || credential.length < 20 || credential.length > 10000) {
        return response.status(400).json({ success: false, message: "A valid Google credential is required" });
    }
    if (intent !== "sign_in" && intent !== "sign_up") {
        return response.status(400).json({ success: false, message: "Choose whether to sign in or create an account" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
        return response.status(503).json({ success: false, message: "Google sign-in is not configured" });
    }

    let identity;
    try {
        identity = await verifyGoogleIdToken(credential, process.env.GOOGLE_CLIENT_ID);
        let user = await userModel.findOne({ googleId: identity.sub });

        if (user) {
            if (user.role === "admin") {
                return response.status(403).json({ success: false, message: "Google sign-in is unavailable for this account" });
            }
            return response.json({ success: true, token: createToken(user), user: safeUser(user) });
        }

        user = await findByVerifiedEmail(identity.email);
        if (user) {
            if (user.role === "admin" || (user.googleId && user.googleId !== identity.sub)) {
                return response.status(409).json({ success: false, message: "This account cannot be linked to this Google account" });
            }
            user.googleId = identity.sub;
            await user.save();
            return response.json({ success: true, token: createToken(user), user: safeUser(user) });
        }

        if (intent === "sign_in") {
            return response.status(404).json({
                success: false,
                code: "ACCOUNT_NOT_FOUND",
                message: "No Elevoni account was found for this Google account. Choose Sign Up to create one."
            });
        }
        if (consentAccepted !== true) {
            return response.status(428).json({
                success: false,
                code: "CONSENT_REQUIRED",
                message: "Please accept the Terms of Use and Privacy Policy to create your Elevoni account."
            });
        }

        const createdUser = await new userModel({
            name: identity.name || identity.email.split("@")[0],
            email: identity.email,
            googleId: identity.sub,
            role: "customer"
        }).save();
        return response.status(201).json({ success: true, token: createToken(createdUser), user: safeUser(createdUser) });
    } catch (error) {
        if (error?.code === "GOOGLE_EMAIL_AMBIGUOUS") {
            return response.status(409).json({ success: false, message: "Multiple accounts match this verified Google email. Please contact support to link the correct account." });
        }
        if (error?.code === "GOOGLE_TOKEN_INVALID") {
            return response.status(401).json({ success: false, code: "GOOGLE_TOKEN_INVALID", message: "Google could not verify this sign-in. Please try again." });
        }
        if (error?.code === 11000) {
            try {
                const concurrentUser = identity ? await userModel.findOne({ $or: [{ googleId: identity.sub }, { email: identity.email }] }) : null;
                if (concurrentUser && concurrentUser.role !== "admin" && concurrentUser.googleId === identity?.sub) {
                    return response.json({ success: true, token: createToken(concurrentUser), user: safeUser(concurrentUser) });
                }
            } catch (lookupError) {
                console.error("Google account conflict lookup failed:", lookupError);
            }
            return response.status(409).json({ success: false, message: "This account could not be linked. Please sign in with your existing method." });
        }
        console.error("Google sign-in error:", error);
        return response.status(500).json({ success: false, message: "Unable to complete Google sign-in" });
    }
};

const currentUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.auth.userId).select("name email role");
        if (!user) return res.status(401).json({ success: false, message: "Authentication required" });
        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to load account" });
    }
};

export { loginUser, registerUser, googleLogin, currentUser };
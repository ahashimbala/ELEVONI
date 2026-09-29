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

const googleLogin = async (req, res) => {
    const { credential, intent, consentAccepted } = req.body || {};
    if (typeof credential !== "string" || credential.length < 20 || credential.length > 10000) {
        return res.status(400).json({ success: false, message: "A valid Google credential is required" });
    }
    if (intent !== "sign_in" && intent !== "sign_up") {
        return res.status(400).json({ success: false, message: "Choose whether to sign in or create an account" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ success: false, message: "Google sign-in is not configured" });
    }

    let identity;
    try {
        identity = await verifyGoogleIdToken(credential, process.env.GOOGLE_CLIENT_ID);
        let user = await userModel.findOne({ googleId: identity.sub });

        if (user) {
            if (user.role === "admin") {
                return res.status(403).json({ success: false, message: "Google sign-in is unavailable for this account" });
            }
            return res.json({ success: true, token: createToken(user), user: safeUser(user) });
        }

        user = await findByVerifiedEmail(identity.email);
        if (user) {
            if (user.role === "admin" || (user.googleId && user.googleId !== identity.sub)) {
                return res.status(409).json({ success: false, message: "This account cannot be linked to this Google account" });
            }
            user.googleId = identity.sub;
            await user.save();
            return res.json({ success: true, token: createToken(user), user: safeUser(user) });
        }

        if (intent === "sign_in") {
            return res.status(404).json({
                success: false,
                code: "ACCOUNT_NOT_FOUND",
                message: "No Elevoni account was found for this Google account. Choose Sign Up to create one."
            });
        }
        if (consentAccepted !== true) {
            return res.status(428).json({
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
        return res.status(201).json({ success: true, token: createToken(createdUser), user: safeUser(createdUser) });
    } catch (error) {
        if (error?.code === "GOOGLE_EMAIL_AMBIGUOUS") {
            return res.status(409).json({ success: false, message: "Multiple accounts match this Google email. Please contact support to link the correct account." });
        }
        if (error?.code === "GOOGLE_TOKEN_INVALID") {
            return res.status(401).json({ success: false, message: "Google could not verify this sign-in. Please try again." });
        }
        if (error?.code === 11000) {
            try {
                const concurrentUser = identity ? await userModel.findOne({ $or: [{ googleId: identity.sub }, { email: identity.email }] }) : null;
                if (concurrentUser && concurrentUser.role !== "admin" && concurrentUser.googleId === identity?.sub) {
                    return res.json({ success: true, token: createToken(concurrentUser), user: safeUser(concurrentUser) });
                }
            } catch (lookupError) {
                console.error("Google account conflict lookup failed:", lookupError);
            }
            return res.status(409).json({ success: false, message: "This account could not be linked. Please sign in with your existing method." });
        }
        console.error("Google sign-in error:", error);
        return res.status(500).json({ success: false, message: "Unable to complete Google sign-in" });
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
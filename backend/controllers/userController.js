import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

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

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
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
        if (await userModel.findOne({ email })) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password" });
        }
        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const user = await new userModel({ name, email, password: hashedPassword, role: "customer" }).save();
        return res.status(201).json({ success: true, token: createToken(user), user: safeUser(user) });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Unable to register" });
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

export { loginUser, registerUser, currentUser };

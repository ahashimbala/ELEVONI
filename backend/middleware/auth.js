import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const authorization = req.get("authorization");
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = bearerToken || req.get("token");

    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (typeof decoded.id !== "string" || !decoded.id || !["customer", "admin"].includes(decoded.role)) {
            return res.status(401).json({ success: false, message: "Invalid authentication token" });
        }
        req.auth = Object.freeze({ userId: decoded.id, role: decoded.role });
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.auth) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!roles.includes(req.auth.role)) {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    return next();
};

export default authMiddleware;

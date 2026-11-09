import express from "express";
import "dotenv/config";
import apiCorsGate from "./middleware/apiCors.js";
import connectDB from "./config/db.js";

import fishRouter from "./routes/fishRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import orderRouter from "./routes/orderRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import vendorRouter from "./routes/vendorRoute.js";
import vendorDirectoryRoutes from "./routes/vendorRoutes.js";
import vendorSalesRouter from "./routes/vendorSalesRoute.js";
import buyerRequirementsRouter from "./routes/buyerRequirementsRoute.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import nAtlasRouter from "./routes/nAtlasRoute.js";
import nAtlasCustomerRouter from "./routes/nAtlasCustomerRoute.js";
import { errorHandler } from "./middleware/errorHandler.js";
import privacyRequestsRouter from "./routes/privacyRequestsRoute.js";
import securityHeaders from "./middleware/securityHeaders.js";
import { createRateLimiter } from "./middleware/rateLimit.js";

const app = express();
app.disable("x-powered-by");
// Vercel terminates TLS and forwards one trusted proxy hop to the function.
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(apiCorsGate);
const apiMutationLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 120, keyPrefix: "api-mutation", message: "Too many requests. Please slow down and try again." });
app.use("/api", (req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return apiMutationLimiter(req, res, next);
    return next();
});
app.use(express.json({ limit: "2mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "64kb", parameterLimit: 100 }));

app.get("/api/health", (req, res) => res.status(200).json({
    status: "ok",
    service: "Elevoni Farms API Engine",
    timestamp: new Date().toISOString()
}));
app.get("/", (req, res) => res.send("API Working"));
app.use("/images", express.static("uploads", { dotfiles: "deny", index: false, fallthrough: false, maxAge: "1d" }));

// Existing storefront APIs: keep these paths stable for the current React app.
app.use("/api/fish", fishRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/review", reviewRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);

// Marketplace and vendor application APIs use vendorProfileModel as the canonical profile.
app.use("/api/vendor/sales", vendorSalesRouter);
app.use("/api/buyer-requirements", buyerRequirementsRouter);
app.use("/api/privacy-requests", privacyRequestsRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/vendors", vendorDirectoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
// Provider-neutral assistant routes. Legacy N-ATLaS paths remain as aliases for old clients.
app.use("/api/assistant/customer", nAtlasCustomerRouter);
app.use("/api/assistant/vendor", nAtlasRouter);
app.use("/api/n-atlas/customer", nAtlasCustomerRouter);
app.use("/api/n-atlas", nAtlasRouter);

app.use((req, res, next) => {
    const error = new Error(`Resource not found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Elevoni Farms API server running on port ${PORT}`);
        });
    });
}

export default app;
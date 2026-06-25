import express from "express";
import cors from "cors";
import 'dotenv/config';

import connectDB from "./config/db.js";

import fishRouter from "./routes/fishRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();

app.use(express.json());
app.use(cors());


app.use("/images", express.static("uploads"));


app.use(async(req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({ success: false, message: "Database connection error" });
    }
});

app.use("/api/fish", fishRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/review", reviewRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
    res.send("API Working");
});

if (process.env.NODE_ENV !== 'production') {
    const port = 4000;
    app.listen(port, () => {
        console.log(`Server Started on http://localhost:${port}`);
    });
}

export default app;
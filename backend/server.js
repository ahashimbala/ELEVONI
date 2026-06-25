import express from "express";
import cors from "cors";
import 'dotenv/config';

import { connectDB } from "./config/db.js";

import fishRouter from "./routes/fishRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

app.use("/api/fish", fishRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/review", reviewRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
    res.send("API Working");
});

const startServer = async() => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(`Server Started on http://localhost:${port}`);
        });

    } catch (error) {
        console.log("Failed to start server:", error);
    }
};

startServer();
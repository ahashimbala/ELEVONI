import mongoose from "mongoose";
import { logSafeError } from "../utils/safeLog.js";

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (err) {
        logSafeError("MongoDB connection failed", err);
        process.exit(1);
    }
};

export default connectDB;
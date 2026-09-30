import mongoose from "mongoose";

const googleSignupContinuationSchema = new mongoose.Schema({
    referenceHash: { type: String, required: true, unique: true },
    purpose: { type: String, enum: ["google_signup_consent"], required: true },
    googleId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

googleSignupContinuationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const googleSignupContinuationModel = mongoose.models.googleSignupContinuation ||
    mongoose.model("googleSignupContinuation", googleSignupContinuationSchema);

export default googleSignupContinuationModel;

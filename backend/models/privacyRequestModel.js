import mongoose from "mongoose";

const privacyRequestSchema = new mongoose.Schema({
  requesterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null, index: true },
  requesterName: { type: String, required: true, trim: true, maxlength: 120 },
  requesterEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
  accountEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  requestType: { type: String, enum: ["access", "correction", "deletion", "restriction", "portability", "objection", "other"], required: true, index: true },
  details: { type: String, trim: true, maxlength: 2000, default: "" },
  status: { type: String, enum: ["received", "verification_required", "in_progress", "completed", "declined"], default: "received", index: true },
  operatorNotes: { type: String, trim: true, maxlength: 2000, default: "" },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

const PrivacyRequest = mongoose.models.PrivacyRequest || mongoose.model("PrivacyRequest", privacyRequestSchema);
export default PrivacyRequest;

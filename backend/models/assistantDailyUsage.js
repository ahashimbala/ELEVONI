import mongoose from "mongoose";

const assistantDailyUsageSchema = new mongoose.Schema({
  identityHash: { type: String, required: true },
  dayKey: { type: String, required: true },
  promptCount: { type: Number, required: true, default: 0, min: 0 },
  identityType: { type: String, enum: ["account", "anonymous", "network"], required: true },
  firstSeenAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
  lastService: { type: String, enum: ["customer", "vendor"], required: true },
}, {
  timestamps: true,
  collection: "assistantdailyusages",
});

assistantDailyUsageSchema.index({ identityHash: 1, dayKey: 1 }, { unique: true, name: "assistant_daily_identity_unique" });
assistantDailyUsageSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 45 * 24 * 60 * 60, name: "assistant_daily_usage_ttl" });

const AssistantDailyUsage = mongoose.models.AssistantDailyUsage
  || mongoose.model("AssistantDailyUsage", assistantDailyUsageSchema);

export default AssistantDailyUsage;

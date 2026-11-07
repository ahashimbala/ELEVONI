import mongoose from "mongoose";

const nAtlasUsageEventSchema = new mongoose.Schema({
  userKey: { type: String, required: true, index: true },
  dayKey: { type: String, required: true },
  identityType: { type: String, enum: ["account", "anonymous"], required: true },
  service: { type: String, enum: ["customer-chat", "customer-transcription", "customer-speech", "vendor-chat", "vendor-transcription", "vendor-speech"], required: true },
  firstSeenAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
}, { timestamps: true, collection: "natlasusageevents" });

nAtlasUsageEventSchema.index({ userKey: 1, dayKey: 1 }, { unique: true });
nAtlasUsageEventSchema.index({ dayKey: 1, lastSeenAt: -1 });
nAtlasUsageEventSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const NAtlasUsageEvent = mongoose.models.NAtlasUsageEvent
  || mongoose.model("NAtlasUsageEvent", nAtlasUsageEventSchema);

export default NAtlasUsageEvent;

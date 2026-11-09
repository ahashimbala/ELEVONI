import validator from "validator";
import mongoose from "mongoose";
import PrivacyRequest from "../models/privacyRequestModel.js";

const clean = (value, max) => typeof value === "string"
  ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
  : "";

const TYPES = new Set(["access", "correction", "deletion", "restriction", "portability", "objection", "other"]);
const STATUSES = new Set(["received", "verification_required", "in_progress", "completed", "declined"]);

export async function createPrivacyRequest(req, res, next) {
  try {
    const requesterName = clean(req.body?.requesterName, 120);
    const requesterEmail = clean(req.body?.requesterEmail, 254).toLowerCase();
    const accountEmail = clean(req.body?.accountEmail, 254).toLowerCase();
    const requestType = clean(req.body?.requestType, 32);
    const details = clean(req.body?.details, 2000);
    if (!requesterName || !validator.isEmail(requesterEmail) || !TYPES.has(requestType)) {
      return res.status(400).json({ success: false, message: "Enter your name, a valid contact email and a valid request type." });
    }
    const record = await PrivacyRequest.create({
      requesterUserId: req.auth?.id || null,
      requesterName, requesterEmail, accountEmail, requestType, details,
      status: "received",
    });
    return res.status(201).json({
      success: true,
      message: "Your privacy request has been recorded. Elevoni will verify your identity before acting on it.",
      data: { reference: String(record._id), status: record.status },
    });
  } catch (error) { return next(error); }
}

export async function listPrivacyRequests(_req, res, next) {
  try {
    const records = await PrivacyRequest.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .select("requesterUserId requesterName requesterEmail accountEmail requestType details status operatorNotes createdAt updatedAt resolvedAt")
      .lean();
    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) { return next(error); }
}

export async function updatePrivacyRequest(req, res, next) {
  try {
    const status = clean(req.body?.status, 32);
    const operatorNotes = clean(req.body?.operatorNotes, 2000);
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid privacy request reference." });
    if (!STATUSES.has(status)) return res.status(400).json({ success: false, message: "Choose a valid request status." });
    const update = {
      status,
      operatorNotes,
      resolvedAt: ["completed", "declined"].includes(status) ? new Date() : null,
    };
    const record = await PrivacyRequest.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .select("requestType status operatorNotes updatedAt resolvedAt");
    if (!record) return res.status(404).json({ success: false, message: "Privacy request not found." });
    return res.status(200).json({ success: true, data: record });
  } catch (error) { return next(error); }
}

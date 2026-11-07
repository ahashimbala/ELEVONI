import { generateListingContent } from "../services/nAtlasListingIntelligence.js";

/**
 * POST /api/n-atlas/listing/generate
 * Protected by verifyToken & requireApprovedVendorProfile (router will add).
 * Expects JSON body with:
 *   category, subcategory (optional), price, unitOfMeasure, plus any of the
 *   fields defined in CATEGORY_FIELD_MAP.
 * Returns:
 *   { success: true, data: { title, description, attributes, summary, keywords, missing } }
 */
export async function generateListing(req, res) {
    try {
        const payload = req.body || {};
        const vendorId = req.vendor?.profileId;
        if (!vendorId) {
            return res.status(403).json({ success: false, message: "An approved vendor profile is required." });
        }
        const result = await generateListingContent({ ...payload, vendorId });
        return res.json({ success: true, data: result });
    } catch (err) {
        if (err.status && err.status < 500) {
            return res.status(err.status).json({ success: false, message: err.message, code: err.code });
        }
        console.error("N‑ATLaS listing generation failed", { status: err.status || null, code: err.code || null, name: err.name || null });
        return res.status(err.status || 502).json({ success: false, message: "Unable to generate listing content right now." });
    }
}
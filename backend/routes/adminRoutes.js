import express from 'express';
import {
  getAllVendors,
  updateVendorStatus,
  getSystemStats,
  getNAtlasUsageStats
} from '../controllers/adminController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createHouseSale, listHouseSales } from '../controllers/houseSalesController.js';
import { listPrivacyRequests, updatePrivacyRequest } from '../controllers/privacyRequestController.js';

const router = express.Router();

// Enforce authentication & admin privileges for all routes in this router
router.use(verifyToken, requireRole('admin'));

// Admin Vendor Governance Routes
router.get('/vendors', getAllVendors);
router.patch('/vendors/:id/status', updateVendorStatus);

// Platform System Analytics Route
router.get('/stats', getSystemStats);
router.get('/natlas-usage', getNAtlasUsageStats);
router.post('/house-sales', createHouseSale);
router.get('/house-sales', listHouseSales);
router.get('/privacy-requests', listPrivacyRequests);
router.patch('/privacy-requests/:id', updatePrivacyRequest);

export default router;
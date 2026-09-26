import express from "express";
import authMiddleware, { requireRole } from "../middleware/auth.js";

import {
    addReview,
    listReviews,
    listAllReviews,
    approveReview,
    deleteReview,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post(
    "/add",
    authMiddleware,
    requireRole("customer"),
    addReview
);

reviewRouter.get(
    "/list",
    listReviews
);

reviewRouter.get(
    "/admin-list",
    authMiddleware,
    requireRole("admin"),
    listAllReviews
);

reviewRouter.post(
    "/approve",
    authMiddleware,
    requireRole("admin"),
    approveReview
);

reviewRouter.post(
    "/delete",
    authMiddleware,
    requireRole("admin"),
    deleteReview
);

export default reviewRouter;
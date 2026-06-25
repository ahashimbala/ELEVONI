import express from "express";
import authMiddleware from "../middleware/auth.js";

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
    addReview
);

reviewRouter.get(
    "/list",
    listReviews
);

reviewRouter.get(
    "/admin-list",
    listAllReviews
);

reviewRouter.post(
    "/approve",
    approveReview
);

reviewRouter.post(
    "/delete",
    deleteReview
);

export default reviewRouter;
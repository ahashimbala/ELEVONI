import reviewModel from "../models/reviewModel.js";
import userModel from "../models/userModel.js";

// add review

const addReview = async(req, res) => {
    try {
        const user = await userModel.findById(req.body.userId);

        if (!user) {
            return res.json({ success: false, message: "User account not found. Please log in again." });
        }

        const newReview = new reviewModel({
            userId: req.body.userId,
            name: user.name,
            comment: req.body.comment,
            rating: req.body.rating
        });

        await newReview.save();
        res.json({ success: true, message: "Review submitted for approval!" });

    } catch (error) {
        console.error("Error in addReview backend:", error);
        res.json({ success: false, message: "Internal Server Error" });
    }
};

// approved reviews only

const listReviews = async(req, res) => {
    try {
        const reviews = await reviewModel
            .find({ approved: true })
            .sort({ date: -1 });

        res.json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Error",
        });
    }
};

// admin page

const listAllReviews = async(req, res) => {
    try {
        const reviews = await reviewModel
            .find({})
            .sort({ date: -1 });

        res.json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Error",
        });
    }
};

// approve review

const approveReview = async(req, res) => {
    try {
        await reviewModel.findByIdAndUpdate(
            req.body.id, {
                approved: true,
            }
        );

        res.json({
            success: true,
            message: "Review Approved",
        });
    } catch (error) {
        console.log(error);

        res.json({
            success: false,
            message: "Error",
        });
    }
};

// delete review

const deleteReview = async(req, res) => {
    try {
        await reviewModel.findByIdAndDelete(
            req.body.id
        );

        res.json({
            success: true,
            message: "Review Deleted",
        });
    } catch (error) {
        console.log(error);

        res.json({
            success: false,
            message: "Error",
        });
    }
};

export {
    addReview,
    listReviews,
    listAllReviews,
    approveReview,
    deleteReview,
};
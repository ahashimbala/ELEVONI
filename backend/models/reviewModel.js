import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    name: {
        type: String,
        required: true,
    },

    comment: {
        type: String,
        required: true,
    },

    rating: {
        type: Number,
        required: true,
        default: 5,
    },

    approved: {
        type: Boolean,
        default: false,
    },

    date: {
        type: Date,
        default: Date.now,
    },
});

const reviewModel = mongoose.model("review", reviewSchema);

export default reviewModel;
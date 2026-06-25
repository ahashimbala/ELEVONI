import "./Reviews.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const Reviews = () => {
  const { url, token } = useContext(StoreContext);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  const [visibleCount, setVisibleCount] = useState(5);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${url}/api/review/list`);
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please log in first to leave a review.");
      return;
    }

    try {
      const response = await axios.post(
        `${url}/api/review/add`,
        {
          comment,
          rating,
        },
        {
          headers: { token },
        },
      );

      if (response.data.success) {
        toast.success("Review submitted for approval!");
        setComment("");
        setRating(5);
        fetchReviews();
      } else {
        toast.error(response.data.message || "Failed to submit review.");
      }
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error(
        error.response?.data?.message ||
          "Server error. Could not submit review.",
      );
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const loadMoreReviews = () => {
    setVisibleCount((prevCount) => prevCount + 5);
  };

  return (
    <div className="reviews" id="reviews">
      <h2>Customer Reviews</h2>

      <form className="review-form" onSubmit={submitReview}>
        <textarea
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>

        <button type="submit">Submit Review</button>
      </form>

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p>No reviews yet. Be the first to leave one!</p>
        ) : (
          reviews.slice(0, visibleCount).map((review) => (
            <div key={review._id} className="review-card">
              <h3>{review.name}</h3>
              <p className="stars">{"★".repeat(review.rating)}</p>
              <p>{review.comment}</p>
            </div>
          ))
        )}
      </div>

      {reviews.length > visibleCount && (
        <div className="show-more-container">
          <button className="show-more-btn" onClick={loadMoreReviews}>
            Show More
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;

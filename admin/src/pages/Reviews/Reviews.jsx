import axios from "axios";
import { useEffect, useState } from "react";
import "./Reviews.css";

const Reviews = ({ url }) => {
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    const response = await axios.get(`${url}/api/review/admin-list`);

    if (response.data.success) {
      setReviews(response.data.data);
    }
  };

  const approveReview = async (id) => {
    await axios.post(`${url}/api/review/approve`, { id });

    fetchReviews();
  };

  const deleteReview = async (id) => {
    await axios.post(`${url}/api/review/delete`, { id });

    fetchReviews();
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="reviews">
      <h2>Manage Reviews</h2>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <span className="review-name">{review.name}</span>

              <span
                className={`review-status ${
                  review.approved ? "approved" : "pending"
                }`}
              >
                {review.approved ? "Approved" : "Pending"}
              </span>
            </div>

            <div className="review-rating">{"★".repeat(review.rating)}</div>

            <p className="review-comment">{review.comment}</p>

            <div className="review-actions">
              {!review.approved && (
                <button
                  className="approve-btn"
                  onClick={() => approveReview(review._id)}
                >
                  Approve
                </button>
              )}

              <button
                className="delete-btn"
                onClick={() => deleteReview(review._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Reviews;

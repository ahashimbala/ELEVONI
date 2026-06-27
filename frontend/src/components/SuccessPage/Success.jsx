import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import "./Success.css";

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="success-page">
      <div className="success-container">
        <img src={assets.parcel_icon} alt="Success" className="success-icon" />
        <h2>Payment Successful!</h2>
        <p>
          Thank you for shopping with Elevoni Farms. Your order has been placed
          successfully.
        </p>
        <div className="success-buttons">
          <button onClick={() => navigate("/myorders")}>Track My Order</button>
          <button onClick={() => navigate("/")} className="secondary-btn">
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;

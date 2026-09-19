import React, { useContext } from "react";
import "./FishItem.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import getProductPrice from "../../utils/pricing";

const FishItem = ({ id, name, image, price, description }) => {
  const { cartItems, addtoCart, removeFromCart, url } =
    useContext(StoreContext);
  const navigate = useNavigate();

  const quantity = cartItems?.[id] || 0;
  const isSmokedCatfish = name?.toLowerCase().includes("smoked catfish");
  const currentPrice = getProductPrice({ name, price }, quantity || 1);

  return (
    <div className="fish-item">
      <img
        className="fish-item-image"
        src={
          image && image.startsWith("http") ? image : `${url}/images/${image}`
        }
        alt={`Fresh ${name} - Premium local aquaculture product from Elevoni Farms`}
        loading="lazy"
        onClick={() => navigate(`/product/${id}`)}
        style={{ cursor: "pointer" }}
      />

      <div className="fish-item-info">
        <div className="fish-item-name-rating">
          <p>{name}</p>
        </div>

        <p className="fish-item-desc">{description}</p>

        <div className="price-display-wrapper">
          <p className="fish-item-price">
            ₦{currentPrice.toLocaleString()}
            <span id="qty"> per kg</span>
          </p>
        </div>

        {isSmokedCatfish && (
          <div className="wholesale-pricing">
            <div className="wholesale-header">
              <p className="wholesale-title">Wholesale pricing</p>
            </div>

            <div className="wholesale-tiers-grid">
              <div
                className={`tier-card ${quantity >= 1 && quantity <= 4 ? "active-tier" : ""}`}
              >
                <span className="tier-range">1–4 kg</span>
                <span className="tier-rate">₦25,000/kg</span>
              </div>

              <div
                className={`tier-card ${quantity >= 5 && quantity <= 9 ? "active-tier" : ""}`}
              >
                <span className="tier-range">5–9 kg</span>
                <span className="tier-rate">₦24,000/kg</span>
              </div>

              <div
                className={`tier-card ${quantity >= 10 && quantity <= 19 ? "active-tier" : ""}`}
              >
                <span className="tier-range">10–19 kg</span>
                <span className="tier-rate">₦22,500/kg</span>
              </div>

              <div
                className={`tier-card ${quantity >= 20 ? "active-tier" : ""}`}
              >
                <span className="tier-range">20+ kg</span>
                <span className="tier-rate">₦21,000/kg</span>
              </div>
            </div>

            <p className="fish-size-note">
              Standard size: 5 pieces per kg. Larger sizes available on request.
            </p>
          </div>
        )}

        <div className="buttons-container">
          {!cartItems?.[id] ? (
            <button
              className="cart-btn init-add-btn"
              onClick={() => addtoCart(id)}
            >
              Add to Cart
            </button>
          ) : (
            <div className="active-cart-row">
              <div className="fish-item-counter">
                <button onClick={() => removeFromCart(id)}>-</button>
                <span>{cartItems[id]}</span>
                <button onClick={() => addtoCart(id)}>+</button>
              </div>

              <button
                className="checkout-badge-btn"
                onClick={() => navigate("/cart")}
              >
                Go to Cart →
              </button>
            </div>
          )}

          <button
            className="details-btn"
            onClick={() => navigate(`/product/${id}`)}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default FishItem;

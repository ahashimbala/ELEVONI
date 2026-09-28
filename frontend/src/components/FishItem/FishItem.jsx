import React, { useContext, useState, useEffect } from "react";
import "./FishItem.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import getProductPrice from "../../utils/pricing";

const FishItem = ({ id, name, image, price, description }) => {
  const { cartItems, addtoCart, removeFromCart, url } =
    useContext(StoreContext);
  const navigate = useNavigate();

  const quantity = cartItems?.[id] || 0;
  const [typedQty, setTypedQty] = useState(quantity || 1);

  // Keep local input state synced with context cart updates
  useEffect(() => {
    if (quantity > 0) {
      setTypedQty(quantity);
    }
  }, [quantity]);

  const isSmokedCatfish = name?.toLowerCase().includes("smoked catfish");
  const displayQty = quantity > 0 ? quantity : typedQty;
  const currentPrice = getProductPrice({ name, price }, displayQty || 1);

  // Direct quantity typing handler
  const handleQuantityInputChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setTypedQty("");
      return;
    }

    const newQty = parseInt(value, 10);
    if (isNaN(newQty) || newQty < 1) return;

    setTypedQty(newQty);
    updateCartToQuantity(newQty);
  };

  // Synchronize typed number with context cart state
  const updateCartToQuantity = (targetQty) => {
    const diff = targetQty - quantity;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) addtoCart(id);
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) removeFromCart(id);
    }
  };

  const handleIncrement = () => {
    const nextQty = (quantity || typedQty) + 1;
    setTypedQty(nextQty);
    addtoCart(id);
  };

  const handleDecrement = () => {
    if (quantity <= 1) {
      removeFromCart(id);
      setTypedQty(1);
    } else {
      const prevQty = quantity - 1;
      setTypedQty(prevQty);
      removeFromCart(id);
    }
  };

  return (
    <div className="single-fish-hero-card">
      {/* Left: Product Media */}
      <div className="hero-image-wrapper">
        <img
          className="hero-fish-image"
          src={
            image && image.startsWith("http") ? image : `${url}/images/${image}`
          }
          alt={`${name} - Premium smoked catfish from Elevoni Farms`}
          loading="eager"
          onClick={() => navigate(`/product/${id}`)}
        />
        <div className="image-overlay-badge">100% Organic & Dried</div>
      </div>

      {/* Right: Product Details & Purchase Form */}
      <div className="hero-fish-info">
        <div className="hero-title-row">
          <h1>{name}</h1>
          <span className="stock-tag">In Stock</span>
        </div>

        <p className="hero-fish-desc">{description}</p>

        <div className="hero-price-wrapper">
          <p className="hero-fish-price">
            ₦{currentPrice.toLocaleString()}
            <span className="price-unit"> / kg</span>
          </p>
        </div>

        {isSmokedCatfish && (
          <div className="wholesale-pricing">
            <div className="wholesale-header">
              <p className="wholesale-title">Wholesale Tier Rates</p>
            </div>

            <div className="wholesale-tiers-grid">
              <div
                className={`tier-card ${
                  displayQty >= 1 && displayQty <= 4 ? "active-tier" : ""
                }`}
              >
                <span className="tier-range">1–4 kg</span>
                <span className="tier-rate">₦25,000/kg</span>
              </div>

              <div
                className={`tier-card ${
                  displayQty >= 5 && displayQty <= 9 ? "active-tier" : ""
                }`}
              >
                <span className="tier-range">5–9 kg</span>
                <span className="tier-rate">₦24,000/kg</span>
              </div>

              <div
                className={`tier-card ${
                  displayQty >= 10 && displayQty <= 19 ? "active-tier" : ""
                }`}
              >
                <span className="tier-range">10–19 kg</span>
                <span className="tier-rate">₦22,500/kg</span>
              </div>

              <div
                className={`tier-card ${displayQty >= 20 ? "active-tier" : ""}`}
              >
                <span className="tier-range">20+ kg</span>
                <span className="tier-rate">₦21,000/kg</span>
              </div>
            </div>

            <p className="fish-size-note">
              Standard weight size: ~5 pieces per kg. Custom large sizes
              available on request.
            </p>
          </div>
        )}

        {/* Quantity Control Panel with Direct Type Input */}
        <div className="hero-purchase-section">
          <label className="quantity-label">Select Quantity (kg):</label>
          <div className="hero-cart-row">
            <div className="fish-item-counter">
              <button
                type="button"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
              >
                -
              </button>

              <input
                type="number"
                min="1"
                max="999"
                className="quantity-type-input"
                value={typedQty}
                onChange={handleQuantityInputChange}
                onBlur={() => {
                  if (!typedQty || typedQty < 1) {
                    setTypedQty(1);
                    updateCartToQuantity(1);
                  }
                }}
              />

              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {!cartItems?.[id] ? (
              <button
                className="cart-btn init-add-btn"
                onClick={() => {
                  updateCartToQuantity(typedQty || 1);
                }}
              >
                Add {typedQty || 1} kg to Cart
              </button>
            ) : (
              <button
                className="checkout-badge-btn"
                onClick={() => navigate("/cart")}
              >
                Go to Cart ({quantity} kg) →
              </button>
            )}
          </div>

          <button
            className="details-btn"
            onClick={() => navigate(`/product/${id}`)}
          >
            View Full Specifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default FishItem;

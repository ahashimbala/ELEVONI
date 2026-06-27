import React, { useContext } from "react";
import "./FishItem.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const FishItem = ({ id, name, image, price, description }) => {
  const { cartItems, addtoCart, removeFromCart, url } =
    useContext(StoreContext);
  const navigate = useNavigate();

  return (
    <div className="fish-item">
      <img
        className="fish-item-image"
        src={
          image && image.startsWith("http") ? image : `${url}/images/${image}`
        }
        alt={name}
      />

      <div className="fish-item-info">
        <div className="fish-item-name-rating">
          <p>{name}</p>
        </div>
        <p className="fish-item-desc">{description}</p>
        <p className="fish-item-price">
          ₦{price.toLocaleString()}
          <span id="qty"> per kg</span>
        </p>

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

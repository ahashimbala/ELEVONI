import React, { useContext } from "react";
import "./FishItem.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { Navigate, useNavigate } from "react-router-dom";

const FishItem = ({ id, name, image, price, description, category }) => {
  const { cartItems, addtoCart, removeFromCart, url } =
    useContext(StoreContext);
  const navigate = useNavigate();

  return (
    <div className="fish-item">
      <div className="fish-item-img-container">
        <img
          className="fish-item-image"
          src={
            item.image && item.image.startsWith("http")
              ? item.image
              : `${url}/images/${item.image}`
          }
          alt={item.name}
        />
        <div className="fish-item-info">
          <div className="fish-item-name-rating">
            <p>{name}</p>
            <img src={assets} alt="" />
          </div>
          <p className="fish-item-desc">{description}</p>
          <p className="fish-item-price">
            ₦{price}
            <span id="qty"> per kg</span>
          </p>
        </div>
        <div className="buttons">
          {!cartItems?.[id] ? (
            <button className="cart-btn" onClick={() => addtoCart(id)}>
              Add to Cart
            </button>
          ) : (
            <div className="fish-item-counter">
              <button onClick={() => removeFromCart(id)}>
                Remove from Cart
              </button>
              <p>{cartItems[id]}</p>
              <button className="cart-btn" onClick={() => addtoCart(id)}>
                Add to Cart
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

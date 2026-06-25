import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { fish_list } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cartItems, fish_list, removeFromCart, getTotalCartAmount, url } =
    useContext(StoreContext);

  const navigate = useNavigate();

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {fish_list.map((item, index) => {
          if (cartItems?.[item._id] > 0) {
            return (
              <div>
                <div className="cart-items-title cart-items-item">
                  <img
                    src={
                      item.image && item.image.startsWith("http")
                        ? item.image
                        : `${url}/images/${item.image}`
                    }
                    alt={item.name}
                  />
                  <p>{item.name}</p>
                  <p>₦{item.price}</p>
                  <p>{cartItems?.[item._id]}</p> {/* Added ?. here too */}
                  <p>₦{item.price * cartItems?.[item._id]}</p>{" "}
                  {/* Added ?. here too */}
                  <p onClick={() => removeFromCart(item._id)} className="cross">
                    x
                  </p>
                </div>
                <hr />
              </div>
            );
          }
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Total</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>₦{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₦{getTotalCartAmount() === 0 ? 0 : 500}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                ₦{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 500}
              </b>
            </div>
          </div>
          <button onClick={() => navigate("/order")}>
            PROCEED TO CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;

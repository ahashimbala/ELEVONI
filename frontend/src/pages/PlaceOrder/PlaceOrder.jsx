import React, { useContext, useState, useEffect } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const { getTotalCartAmount, fish_list, cartItems, url, token, setCartItems } =
    useContext(StoreContext);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  const navigate = useNavigate();

  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const orderOnWhatsApp = async () => {
    if (!data.firstName || !data.phone || !data.street) {
      toast.error(
        "Please fill in your First Name, Phone Number and Street Address.",
      );
      return;
    }

    const loadingToast = toast.loading("Processing order...");

    try {
      let orderItems = [];

      fish_list.forEach((item) => {
        if (cartItems[item._id] > 0) {
          let itemInfo = {
            ...item,
            quantity: cartItems[item._id],
          };

          orderItems.push(itemInfo);
        }
      });

      const totalAmount =
        getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 500;

      const orderData = {
        address: data,
        items: orderItems,
        amount: totalAmount,
      };

      const response = await axios.post(`${url}/api/order/place`, orderData, {
        headers: {
          token,
        },
      });

      if (response.data.success) {
        const phoneNumber = "2348135738991";

        let message = "Hello Elevoni, I would like to place an order.\n\n";

        fish_list.forEach((item) => {
          if (cartItems[item._id] > 0) {
            message += `• ${item.name} x ${cartItems[item._id]}\n`;
          }
        });

        message += `\n--------------------------------`;
        message += `\nTotal Amount: ₦${totalAmount}`;
        message += `\n--------------------------------`;

        message += `\n\nDelivery Information:`;
        message += `\nName: ${data.firstName} ${data.lastName}`;
        message += `\nPhone: ${data.phone}`;
        message += `\nAddress: ${data.street}, ${data.city}, ${data.state}, ${data.country}`;

        const encodedMessage = encodeURIComponent(message);

        window.open(
          `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
          "_blank",
        );

        if (setCartItems) {
          setCartItems({});
        }

        toast.update(loadingToast, {
          render: "Order placed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        navigate("/myorders");
      } else {
        toast.update(loadingToast, {
          render:
            response.data.message ||
            "Failed to record order. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.log(error);

      toast.update(loadingToast, {
        render: "An error occurred while saving your order.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (!token) {
      toast.info("Please log in to proceed to checkout.");
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      toast.warn("Your cart is empty. Add some items first!");
      navigate("/cart");
    }
  }, [token, getTotalCartAmount, navigate]);

  return (
    <form className="place-order">
      <div className="place-order-left">
        <p className="title">Delivery Information</p>

        <div className="multi-fields">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={data.firstName}
            onChange={onChangeHandler}
            required
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={data.lastName}
            onChange={onChangeHandler}
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={data.email}
          onChange={onChangeHandler}
        />

        <input
          type="text"
          name="street"
          placeholder="Street"
          value={data.street}
          onChange={onChangeHandler}
          required
        />

        <div className="multi-fields">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={data.city}
            onChange={onChangeHandler}
          />

          <input
            type="text"
            name="state"
            placeholder="State"
            value={data.state}
            onChange={onChangeHandler}
          />
        </div>

        <div className="multi-fields">
          <input
            type="text"
            name="zipCode"
            placeholder="Zip Code"
            value={data.zipCode}
            onChange={onChangeHandler}
          />

          <input
            type="text"
            name="country"
            placeholder="Country"
            value={data.country}
            onChange={onChangeHandler}
          />
        </div>

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={data.phone}
          onChange={onChangeHandler}
          required
        />
      </div>

      <div className="place-order-right">
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

          <button type="button" className="order-btn" onClick={orderOnWhatsApp}>
            <FaWhatsapp />
            ORDER ON WHATSAPP
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;

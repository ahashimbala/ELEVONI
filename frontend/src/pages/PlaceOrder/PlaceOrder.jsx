import React, { useContext, useState, useEffect } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { FaWhatsapp, FaCreditCard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import getProductPrice from "../../utils/pricing";

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
    country: "",
    phone: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const navigate = useNavigate();

  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getOrderItems = () => {
    const orderItems = [];

    fish_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        orderItems.push({
          ...item,
          quantity: cartItems[item._id],
        });
      }
    });

    return orderItems;
  };

  const getProductPrice = (item, quantity) => {
    const isSmokedCatfish = item.name?.toLowerCase().includes("smoked catfish");

    if (!isSmokedCatfish) {
      return item.price;
    }

    if (quantity >= 20) {
      return 21000;
    }

    if (quantity >= 10) {
      return 22500;
    }

    if (quantity >= 5) {
      return 24000;
    }

    return 25000;
  };

  const getWholesaleSubtotal = () => {
    let subtotal = 0;

    fish_list.forEach((item) => {
      const quantity = Number(cartItems[item._id] || 0);

      if (quantity > 0) {
        const price = getProductPrice(item, quantity);
        subtotal += price * quantity;
      }
    });

    return subtotal;
  };

  const subtotal = getWholesaleSubtotal();

  const deliveryFee = subtotal > 0 ? 2500 : 0;

  const totalAmount = subtotal + deliveryFee;

  const orderWithPaystack = async () => {
    if (!data.firstName || !data.phone || !data.street || !data.email) {
      toast.error(
        "Please fill in your First Name, Email, Phone Number, and Street Address.",
      );
      return;
    }

    if (!window.PaystackPop || typeof window.PaystackPop.setup !== "function") {
      toast.error(
        "Paystack payment gateway failed to initialize. Please refresh the page.",
      );
      return;
    }

    const loadingToast = toast.loading("Initializing payment...");

    try {
      const orderItems = getOrderItems();

      const response = await axios.post(
        `${url}/api/payment/initialize`,
        {
          email: data.email,
          items: orderItems,
        },
        {
          headers: { token },
        },
      );

      if (!response.data.success) {
        toast.update(loadingToast, {
          render: response.data.message || "Unable to initialize payment.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });

        return;
      }

      toast.dismiss(loadingToast);

      const paystack = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: data.email,
        amount: response.data.amount * 100,
        currency: "NGN",
        ref: response.data.reference,

        callback: async (reference) => {
          const verifyingToast = toast.loading("Verifying transaction...");

          try {
            const verifyResponse = await axios.post(
              `${url}/api/payment/verify`,
              {
                reference: reference.reference,
                items: orderItems,
              },
              {
                headers: { token },
              },
            );

            if (!verifyResponse.data.success) {
              toast.update(verifyingToast, {
                render:
                  verifyResponse.data.message || "Payment verification failed.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
              });

              return;
            }

            const orderResponse = await axios.post(
              `${url}/api/order/place`,
              {
                items: orderItems,
                address: data,
                payment: true,
                paymentReference: reference.reference,
              },
              {
                headers: { token },
              },
            );

            if (orderResponse.data.success) {
              setIsSubmitted(true);

              if (setCartItems) {
                setCartItems({});
              }

              toast.update(verifyingToast, {
                render: "Payment successful! Order placed.",
                type: "success",
                isLoading: false,
                autoClose: 3000,
              });

              navigate("/success");
            } else {
              toast.update(verifyingToast, {
                render:
                  orderResponse.data.message ||
                  "Payment succeeded but order could not be saved.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
              });
            }
          } catch (error) {
            console.error(error);

            toast.update(verifyingToast, {
              render:
                error.response?.data?.message || "Error processing your order.",
              type: "error",
              isLoading: false,
              autoClose: 5000,
            });
          }
        },

        onClose: () => {
          toast.info("Payment window closed.");
        },
      });

      paystack.openIframe();
    } catch (error) {
      console.error(error);

      toast.update(loadingToast, {
        render:
          error.response?.data?.message || "Unable to initialize payment.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
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
      const orderItems = getOrderItems();

      const orderData = {
        address: data,
        items: orderItems,
        payment: false,
      };

      const response = await axios.post(`${url}/api/order/place`, orderData, {
        headers: { token },
      });

      if (response.data.success) {
        const phoneNumber = "2348135738991";

        let message = "Hello Elevoni, I would like to place an order.\n\n";

        orderItems.forEach((item) => {
          const price = getProductPrice(item, item.quantity);

          message += `• ${item.name} x ${item.quantity} — ₦${(
            price * item.quantity
          ).toLocaleString()}\n`;
        });

        message += `\n--------------------------------`;
        message += `\nSubtotal: ₦${subtotal.toLocaleString()}`;
        message += `\nDelivery Fee: ₦${deliveryFee.toLocaleString()}`;
        message += `\nTotal Amount: ₦${totalAmount.toLocaleString()}`;
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

        setIsSubmitted(true);

        if (setCartItems) {
          setCartItems({});
        }

        toast.update(loadingToast, {
          render: "Order placed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        navigate("/success");
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
      console.error(error);

      toast.update(loadingToast, {
        render:
          error.response?.data?.message ||
          "An error occurred while saving your order.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (isSubmitted) return;

    if (!token) {
      toast.info("Please log in to proceed to checkout.");
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      toast.warn("Your cart is empty. Add some items first!");
      navigate("/cart");
    }
  }, [token, getTotalCartAmount, navigate, isSubmitted]);

  return (
    <div className="place-order">
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
          required
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
              <p>₦{subtotal.toLocaleString()}</p>
            </div>

            <hr />

            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>₦{deliveryFee.toLocaleString()}</p>
            </div>

            <hr />

            <div className="cart-total-details">
              <p>Total</p>
              <b>₦{totalAmount.toLocaleString()}</b>
            </div>
          </div>

          <div className="action-buttons-wrapper">
            <button
              type="button"
              className="paystack-btn"
              onClick={orderWithPaystack}
            >
              <FaCreditCard />
              PAY ONLINE NOW
            </button>

            <div className="custom-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="order-btn"
              onClick={orderOnWhatsApp}
            >
              <FaWhatsapp />
              ORDER ON WHATSAPP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;

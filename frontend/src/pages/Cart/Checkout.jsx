import React, { useContext, useState } from "react";
import { usePaystackPayment } from "react-paystack";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const Checkout = () => {
  const { cartItems, fish_list, getTotalCartAmount, url } =
    useContext(StoreContext);
  const [email, setEmail] = useState("");

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: getTotalCartAmount() * 100,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const handleSuccess = async (reference) => {
    try {
      const response = await axios.post(`${url}/api/payment/verify`, {
        reference: reference.reference,
      });

      if (response.data.success) {
        alert("Order placed successfully!");
      } else {
        alert("Payment verification failed.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => {
    alert("Payment window closed.");
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <input
        type="email"
        placeholder="Enter Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <p>Total: ₦{getTotalCartAmount().toLocaleString()}</p>
      <button
        onClick={() => {
          if (!email) return alert("Email is required");
          initializePayment(handleSuccess, handleClose);
        }}
      >
        Pay Now with Paystack
      </button>
    </div>
  );
};

export default Checkout;

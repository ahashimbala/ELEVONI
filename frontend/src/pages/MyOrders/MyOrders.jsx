import React, { useState, useContext, useEffect } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.post(
        url + "/api/order/userorders",
        {},
        { headers: { token } },
      );
      setData(response.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const handleTrackOnWhatsApp = (order) => {
    const phoneNumber = "2348135738991";

    const itemsText = order.items
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(", ");

    const message =
      `Hello, I'd like to check the status of my order!\n\n` +
      `Name: ${order.address.firstName} ${order.address.lastName}\n` +
      `Items: ${itemsText}\n` +
      `Total Amount:₦${order.amount}.00\n` +
      `Current Status: ${order.status}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
      "_blank",
    );
  };

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.length === 0 ? (
          <p>You haven't placed any orders yet.</p>
        ) : (
          data.map((order, index) => {
            return (
              <div key={index} className="my-orders-order">
                <img src={assets.parcel_icon} alt="" />
                <p>
                  {order.items.map((item, itemIndex) => {
                    if (itemIndex === order.items.length - 1) {
                      return item.name + " x " + item.quantity;
                    } else {
                      return item.name + " x " + item.quantity + ", ";
                    }
                  })}
                </p>
                <p>₦{order.amount}.00</p>
                <p>Items: {order.items.length}</p>
                <p>
                  <span>&#x25cf;</span> <b>{order.status}</b>
                </p>

                <button
                  className="whatsapp-track-btn"
                  onClick={() => handleTrackOnWhatsApp(order)}
                >
                  Track on WhatsApp
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrders;

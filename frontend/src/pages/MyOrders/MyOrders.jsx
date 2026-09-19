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

      if (response.data.success) {
        setData(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setData([]);
        console.error("Failed to fetch orders:", response.data.message);
      }
    } catch (error) {
      setData([]);
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setData([]);
    }
  }, [token]);

  const handleTrackOnWhatsApp = (order) => {
    const phoneNumber = "2348135738991";

    const itemsText = Array.isArray(order.items)
      ? order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")
      : "";

    const firstName = order.address?.firstName || "";
    const lastName = order.address?.lastName || "";

    const message =
      `Hello, I'd like to check the status of my order!\n\n` +
      `Name: ${firstName} ${lastName}\n` +
      `Items: ${itemsText}\n` +
      `Total Amount: ₦${order.amount || 0}.00\n` +
      `Current Status: ${order.status || "Processing"}`;

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
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div key={order._id || index} className="my-orders-order">
                <img src={assets.parcel_icon} alt="" />

                <p>
                  {items.map((item, itemIndex) => (
                    <React.Fragment key={itemIndex}>
                      {item.name} x {item.quantity}
                      {itemIndex !== items.length - 1 ? ", " : ""}
                    </React.Fragment>
                  ))}
                </p>

                <p>₦{Number(order.amount || 0).toLocaleString()}.00</p>

                <p>Items: {items.length}</p>

                <p>
                  <span>&#x25cf;</span> <b>{order.status || "Processing"}</b>
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

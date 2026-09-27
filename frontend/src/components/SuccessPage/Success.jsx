import { useLocation, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import "./Success.css";
const Success = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const paid = state?.paymentStatus === "successful";
  return <div className="success-page"><div className="success-container">
    <img src={assets.parcel_icon} alt="" className="success-icon" />
    <h2>{paid ? "Payment Confirmed" : "Order Request Submitted"}</h2>
    <p>{paid ? "Your Paystack payment was verified and your order is confirmed." : "Your request was saved. Elevoni will confirm the order and payment arrangements through WhatsApp."}</p>
    {state?.orderId && <p>Order reference: {state.orderId}</p>}
    <div className="success-buttons"><button onClick={() => navigate("/myorders")}>Track My Order</button><button onClick={() => navigate("/")} className="secondary-btn">Go to Home</button></div>
  </div></div>;
};
export default Success;

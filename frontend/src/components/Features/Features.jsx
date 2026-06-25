import "./Features.css";
import { FaLeaf, FaShieldAlt, FaTruck, FaAward } from "react-icons/fa";

const Features = () => {
  return (
    <div className="features">
      <div className="feature-card">
        <FaLeaf />
        <div>
          <h3>Farm Raised</h3>
          <p>Healthy and naturally fed</p>
        </div>
      </div>

      <div className="feature-card">
        <FaShieldAlt />
        <div>
          <h3>Hygienically Processed</h3>
          <p>Cleaned and handled with care</p>
        </div>
      </div>

      <div className="feature-card">
        <FaTruck />
        <div>
          <h3>Fast Delivery</h3>
          <p>Delivering Nationwide</p>
        </div>
      </div>

      <div className="feature-card">
        <FaAward />
        <div>
          <h3>Premium Quality</h3>
          <p>You can trust every order</p>
        </div>
      </div>
    </div>
  );
};

export default Features;

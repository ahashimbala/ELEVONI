import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img id="logo" src={assets.logo} alt="" />
          <p>
            Elevoni is committed to providing fresh, healthy and premium-quality
            catfish to homes, restaurants and businesses. Through sustainable
            fish farming practices and excellent customer service, we ensure
            every customer receives the best products at affordable prices.
            Thank you for choosing Elevoni - where quality meets freshness.
          </p>
          <div className="footer-social-icons">
            <a
              href="https://www.facebook.com/YourPageName"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>

            <a
              href="https://x.com/feedoh_bala"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img id="twitter" src={assets.twitter_icon} alt="X" />
            </a>

            <a
              href="https://www.instagram.com/elevoni_"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img id="insta" src={assets.insta} alt="Instagram" />
            </a>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>+234 813 573 8991</li>
            <li>Feedoh001@gmail.com</li>
            <li>Kano, Nigeria</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright 2026 &copy; ELEVONI - All Rights Reserved.
      </p>
    </div>
  );
};

export default Footer;

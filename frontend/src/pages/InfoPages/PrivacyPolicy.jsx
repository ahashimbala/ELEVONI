import React from "react";
import "./InfoPages.css";

const PrivacyPolicy = () => {
  return (
    <div className="info-page-container">
      <h1>Privacy Policy</h1>
      <p className="info-page-subtitle">Effective Date: September 2026</p>

      <p>
        Elevoni Farms ("Elevoni", "we", "us", or "our") respects your business
        privacy and is committed to protecting the personal and operational data
        collected through our digital platforms.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information necessary to process commercial orders and
        maintain customer accounts, including:
      </p>
      <ul>
        <li>
          <strong>Contact Data:</strong> Name, business name, phone number, and
          official email address.
        </li>
        <li>
          <strong>Logistics Data:</strong> Physical address, kitchen contact
          person, and delivery instructions.
        </li>
        <li>
          <strong>Transaction Data:</strong> Quantities ordered, transaction
          dates, and order history.
        </li>
      </ul>

      <div className="info-callout-box">
        <h3>2. Payment Security</h3>
        <p>
          All digital card transactions, transfer confirmations, and electronic
          payments are processed securely through <strong>Paystack</strong>.
          Elevoni does not store, capture, or handle sensitive banking PINs or
          credit card numbers on our local servers.
        </p>
      </div>

      <h2>3. How Information Is Used</h2>
      <p>Collected data is strictly utilized to:</p>
      <ul>
        <li>Process, package, and deliver your wholesale orders.</li>
        <li>
          Issue invoice confirmations and manage repeat delivery schedules.
        </li>
        <li>
          Analyze platform usage via analytics tools (Google Analytics) to
          improve ordering convenience.
        </li>
      </ul>

      <h2>4. Third-Party Sharing</h2>
      <p>
        We do not sell, rent, or monetize your business information. Third-party
        data sharing is strictly limited to verified fulfillment or logistics
        partners directly involved in completing your delivery.
      </p>

      <h2>5. Contact Information</h2>
      <p>
        For inquiries regarding data policy or account updates, contact our
        administrative team at <strong>ahashimbala01@gmail.com</strong>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;

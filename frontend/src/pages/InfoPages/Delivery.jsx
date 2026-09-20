import React from "react";
import "./InfoPages.css";

const Delivery = () => {
  return (
    <div className="info-page-container">
      <h1>Wholesale Delivery Policy</h1>
      <p className="info-page-subtitle">
        Scheduled delivery details and operational coverage for commercial
        accounts across Abuja.
      </p>

      <h2>Coverage Areas</h2>
      <p>
        We provide scheduled delivery services directly to hotels, restaurants,
        caterers, and food vendors within major Abuja hubs:
      </p>
      <ul>
        <li>Wuse & Wuse II</li>
        <li>Maitama & Asokoro</li>
        <li>Central Business District (CBD)</li>
        <li>Mabushi</li>
        <li>Garki & Durumi</li>
        <li>
          Special arrangements available for bulk orders outside primary zones
        </li>
      </ul>

      <div className="info-callout-box">
        <h3>Order & Dispatch Timelines</h3>
        <ul>
          <li>
            <strong>Standard Wholesale Orders:</strong> Orders confirmed before
            12:00 PM are scheduled for next-day business delivery.
          </li>
          <li>
            <strong>Kitchen Trial Orders:</strong> First-time trial quantities
            (1–5 kg) are dispatched according to custom kitchen inspection
            schedules.
          </li>
        </ul>
      </div>

      <h2>Handover & Order Verification</h2>
      <p>
        To ensure strict quality control, we follow a simple direct handover
        process:
      </p>
      <ul>
        <li>
          <strong>Kitchen Inspection:</strong> Upon delivery, your receiving
          officer or kitchen manager is requested to inspect product weight and
          seals.
        </li>
        <li>
          <strong>Sign-Off:</strong> Once verified, delivery sign-off is
          completed digitally or via paper invoice.
        </li>
        <li>
          <strong>Immediate Reporting:</strong> Any discrepancies in quantity or
          order specification must be noted at the time of handover.
        </li>
      </ul>
    </div>
  );
};

export default Delivery;

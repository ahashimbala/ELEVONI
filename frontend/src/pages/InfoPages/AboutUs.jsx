import React from "react";
import "./InfoPages.css";

const AboutUs = () => {
  return (
    <div className="info-page-container">
      <h1>About Elevoni Farms</h1>
      <p className="info-page-subtitle">
        Bridging the gap between reliable food production, standardized
        processing, and commercial buyers.
      </p>

      <p>
        Elevoni Farms is an agricultural technology and supply venture dedicated
        to modernizing produce distribution across Nigeria. We begin our focus
        with commercial wholesale smoked catfish, built on transparency,
        hygienic standards, and reliable business-to-business logistics.
      </p>

      <div className="info-callout-box">
        <h3>What We Stand For</h3>
        <p>
          Agricultural sourcing should not rely on unpredictable informal
          markets. We bring consistency, portion control, and modern service
          standards to commercial kitchens.
        </p>
      </div>

      <h2>Our Core Standards</h2>
      <ul>
        <li>
          <strong>Consistent Sizing:</strong> Standardized weight profiles
          (standard 5 pieces per kg) so kitchen portion control and food
          costings remain completely predictable.
        </li>
        <li>
          <strong>Hygienic Processing:</strong> Processed and smoked using
          controlled standards to deliver shelf stability and clean, natural
          flavor without heavy grit or ash.
        </li>
        <li>
          <strong>Commercial Reliability:</strong> Scheduled deliveries designed
          directly around the operational timelines of hotels, restaurants, and
          caterers.
        </li>
      </ul>

      <h2>Our Vision</h2>
      <p>
        We are building digital and physical infrastructure to simplify
        agricultural access. Starting with processed fish supply in Abuja,
        Elevoni is evolving toward an integrated agricultural marketplace
        connecting verified producers directly to commercial markets.
      </p>
    </div>
  );
};

export default AboutUs;

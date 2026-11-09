import React from "react";
import { Helmet } from "react-helmet-async";
import "./InfoPages.css";

export default function CookiePolicy() {
  const openPreferences = () => window.dispatchEvent(new Event("elevoni-cookie-settings"));
  return (
    <main className="info-page-container">
      <Helmet>
        <title>Cookie Policy | Elevoni Farms</title>
        <meta name="description" content="Learn about essential browser storage and optional analytics on Elevoni Farms." />
        <link rel="canonical" href="https://elevonifarms.vercel.app/cookies" />
      </Helmet>
      <p className="info-page-eyebrow">Website preferences</p>
      <h1>Cookie Policy</h1>
      <p className="info-page-subtitle">Effective date: 9 November 2026</p>
      <p>Elevoni uses essential browser storage to operate website features and remember selected preferences. Optional analytics is disabled until you accept it in the cookie banner.</p>
      <h2>1. Essential storage</h2>
      <p>Essential local browser storage may remember your language, session-related application state, cart preferences and cookie choice. These items support features you request and are not used to create advertising profiles.</p>
      <h2>2. Optional analytics</h2>
      <p>If you select “Accept analytics”, Elevoni loads Google Analytics 4 (measurement ID G-QCJVJSCEBQ) to understand aggregate website usage and improve the service. If you reject optional analytics, the analytics library is not initialised by the storefront. Your choice is stored in this browser using local storage.</p>
      <h2>3. Third-party services</h2>
      <p>Payment, Google sign-in and embedded third-party services may use their own cookies or similar technologies when you actively use those features. Their operation is governed by the relevant provider's notices and controls.</p>
      <h2>4. Change your choice</h2>
      <p>You can change your optional analytics choice at any time using the button below. You can also clear local storage in your browser settings.</p>
      <button type="button" className="info-cookie-settings-button" onClick={openPreferences}>Open cookie preferences</button>
      <h2>5. Contact</h2>
      <p>For questions, contact <a href="mailto:ahashimbala01@gmail.com">ahashimbala01@gmail.com</a>.</p>
    </main>
  );
}

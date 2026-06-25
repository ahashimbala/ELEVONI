import React, { useState } from "react";
import "./Header.css";

const Header = () => {
  return (
    <div className="header">
      <div className="header-contents">
        <h2>
          Fresh & Smoked Catfish <br />
          Delivered to Your <br />
          Doorstep
        </h2>
        <p>We farm and smoke premium catfish in Nigeria.</p>
        <button>Shop Now</button>
      </div>
    </div>
  );
};

export default Header;

import React, { useContext, useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Handle sticky scroll background shift
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setProfileDropdownOpen(false);
    navigate("/");
  };

  const handleNavClick = (menuItem) => {
    setMenu(menuItem);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`navbar ${isScrolled ? "scrolled" : ""}`}
      aria-label="Main Navigation"
    >
      <Link to="/" className="navbar-logo-link">
        <img src={assets.logo} alt="Elevoni Logo" className="logo" />
      </Link>

      {/* Navigation Links Sidebar Drawer */}
      <ul className={`navbar-menu ${mobileMenuOpen ? "mobile-active" : ""}`}>
        {/* Dedicated Close 'X' Button at the top of the Mobile Drawer */}
        <li className="mobile-menu-close">
          <button
            className="close-drawer-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </li>

        <li>
          <a
            href="/"
            onClick={() => handleNavClick("home")}
            className={menu === "home" ? "active" : ""}
          >
            home
          </a>
        </li>
        <li>
          <a
            href="#explore-menu"
            onClick={() => handleNavClick("shop")}
            className={menu === "shop" ? "active" : ""}
          >
            shop
          </a>
        </li>
        <li>
          <a
            href="#reviews"
            onClick={() => handleNavClick("reviews")}
            className={menu === "reviews" ? "active" : ""}
          >
            reviews
          </a>
        </li>
        <li>
          <a
            href="#app-download"
            onClick={() => handleNavClick("mobile-app")}
            className={menu === "mobile-app" ? "active" : ""}
          >
            mobile-app
          </a>
        </li>
        <li>
          <a
            href="#footer"
            onClick={() => handleNavClick("contact-us")}
            className={menu === "contact-us" ? "active" : ""}
          >
            contact us
          </a>
        </li>
      </ul>

      {/* Right Action Items */}
      <div className="navbar-right">
        {/* Shopping Cart Icon (26px) */}
        <div className="navbar-search-icon">
          <Link to="/cart" aria-label="Shopping Cart">
            <FaShoppingCart />
          </Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>

        {/* Profile Avatar Icon (Matched to 26px) */}
        {!token ? (
          <button onClick={() => setShowLogin(true)}>sign in</button>
        ) : (
          <div className="navbar-profile" ref={dropdownRef}>
            <img
              src={assets.profile_icon}
              alt="User Profile"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
            />
            <ul
              className={`nav-profile-dropdown ${profileDropdownOpen ? "show" : ""}`}
            >
              <li
                onClick={() => {
                  navigate("/myorders");
                  setProfileDropdownOpen(false);
                }}
              >
                <img src={assets.bag_icon} alt="" />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" />
                <p>Logout</p>
              </li>
              <hr />
            </ul>
          </div>
        )}

        {/* Mobile Hamburger Menu Icon (26px) */}
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <FaBars />
        </button>
      </div>

      {/* Backdrop Overlay when Mobile Drawer is open */}
      {mobileMenuOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;

import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import Reviews from "./components/Reviews/Reviews";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import ScrollToTop from "./components/ScrollToTop";
import AboutUs from "./pages/InfoPages/AboutUs";
import Delivery from "./pages/InfoPages/Delivery";
import PrivacyPolicy from "./pages/InfoPages/PrivacyPolicy";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ItemDetails from "./pages/ItemDetails/ItemDetails";
import ReactGA from "./analytics";

ReactGA.send({
  hitType: "pageview",
  page: window.location.pathname,
});

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <HelmetProvider>
      <ScrollToTop />
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <Navbar setShowLogin={setShowLogin} />
      <div className="app">
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/product/:id" element={<ItemDetails />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
      <Footer />
    </HelmetProvider>
  );
};

export default App;

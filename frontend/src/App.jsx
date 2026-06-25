import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import Reviews from "./components/Reviews/Reviews";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import ScrollToTop from "./components/ScrollToTop";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ItemDetails from "./pages/ItemDetails/ItemDetails";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <>
      <ScrollToTop />
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className="app">
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/product/:id" element={<ItemDetails />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;

import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route } from "react-router-dom";
import AddProduct from "./pages/AddProduct/AddProduct";
import AddMedia from "./pages/AddMedia/AddMedia";
import List from "./pages/List/List";
import Order from "./pages/Orders/Order";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Reviews from "./pages/Reviews/Reviews";

const App = () => {
  const url = "https://elevoni-backend.vercel.app";

  return (
    <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/list" element={<List url={url} />} />
          <Route path="/orders" element={<Order url={url} />} />
          <Route path="/reviews" element={<Reviews url={url} />} />
          <Route path="/add" element={<AddProduct url={url} />} />
          <Route path="/add-media/:id" element={<AddMedia url={url} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VendorLayout from "./components/Layout/VendorLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import SalesLog from "./pages/SalesLog/SalesLog";
import Login from "./pages/Login/Login";
import Apply from "./pages/Apply/Apply";
import NotFound from "./pages/NotFound/NotFound";
import NAtlas from "./pages/NAtlas/NAtlas";
import BuyerMatches from "./pages/BuyerMatches/BuyerMatches";
import SalesInsights from "./pages/SalesInsights/SalesInsights";

const App = () => {
  return (
    <>
      <Routes>
        <Route element={<VendorLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales" element={<SalesLog />} />
          <Route path="/buyer-matches" element={<BuyerMatches />} />
          <Route path="/sales-insights" element={<SalesInsights />} />
          <Route path="/assistant" element={<NAtlas />} />
          <Route path="/elevoni-assistant" element={<Navigate to="/assistant" replace />} />
          <Route path="/tinka" element={<Navigate to="/assistant" replace />} />
          <Route path="/konekta" element={<Navigate to="/assistant" replace />} />
          <Route path="/n-atlas" element={<Navigate to="/assistant" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </>
  );
};

export default App;

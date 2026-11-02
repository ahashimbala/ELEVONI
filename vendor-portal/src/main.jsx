import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import "./styles/splash.css";

function StartupSplash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let timer;
    const dismiss = () => window.requestAnimationFrame(() => {
      timer = window.setTimeout(() => setVisible(false), 250);
    });
    if (document.readyState === "complete") dismiss();
    else window.addEventListener("load", dismiss, { once: true });
    return () => { window.removeEventListener("load", dismiss); window.clearTimeout(timer); };
  }, []);
  return visible ? <div className="startup-splash" role="status" aria-label="Loading Elevoni Vendor Portal"><img src="/splash-screen.png" alt="Elevoni Farms" /></div> : null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <StartupSplash />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

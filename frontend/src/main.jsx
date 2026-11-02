import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter} from 'react-router-dom'
import StoreContextProvider from './context/StoreContext.jsx'
import './splash.css'

function StartupSplash() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    let timer
    const dismiss = () => {
      window.requestAnimationFrame(() => {
        timer = window.setTimeout(() => setVisible(false), 250)
      })
    }
    if (document.readyState === 'complete') dismiss()
    else window.addEventListener('load', dismiss, { once: true })
    return () => { window.removeEventListener('load', dismiss); window.clearTimeout(timer) }
  }, [])
  return visible ? <div className="startup-splash" role="status" aria-label="Loading Elevoni Farms"><img src="/splash-screen.png" alt="Elevoni Farms" /></div> : null
}

// Capture Chromium's install event at module startup so React mounting time
// cannot cause the one-shot beforeinstallprompt event to be missed.
if (typeof window !== "undefined") {
  window.deferredInstallPrompt = window.deferredInstallPrompt || null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.deferredInstallPrompt = event;
    window.dispatchEvent(new Event("elevoni-install-available"));
  });
  window.addEventListener("appinstalled", () => {
    window.deferredInstallPrompt = null;
    window.dispatchEvent(new Event("elevoni-app-installed"));
  });
}


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StoreContextProvider>
        <App />
        <StartupSplash />
    </StoreContextProvider>
  
  </BrowserRouter>,
)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => {
        registration.update().catch(() => {});
        window.setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error("Elevoni service worker registration failed:", error);
      });
  });
}
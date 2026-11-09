import ReactGA from "react-ga4";

const MEASUREMENT_ID = "G-QCJVJSCEBQ";
let initialized = false;

export function hasAnalyticsConsent() {
  try {
    return window.localStorage.getItem("elevoni-cookie-consent") === "accepted";
  } catch {
    return false;
  }
}

export function enableAnalytics() {
  if (!hasAnalyticsConsent()) return false;
  if (!initialized) {
    ReactGA.initialize(MEASUREMENT_ID, { gaOptions: { send_page_view: false } });
    initialized = true;
  } else {
    try { ReactGA.gtag("consent", "update", { analytics_storage: "granted" }); } catch {}
  }
  return true;
}

export function disableAnalytics() {
  if (initialized) {
    try { ReactGA.gtag("consent", "update", { analytics_storage: "denied" }); } catch {}
  }
  try {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name === "_ga" || name.startsWith("_ga_")) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      }
    });
  } catch {}
}

const analytics = {
  send(payload) {
    if (!enableAnalytics()) return;
    ReactGA.send(payload);
  },
};

export default analytics;

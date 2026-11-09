import { useEffect, useState } from "react";
import ReactGA, { disableAnalytics, enableAnalytics, hasAnalyticsConsent } from "../../analytics";
import "./CookieConsent.css";

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    try { return !window.localStorage.getItem("elevoni-cookie-consent"); }
    catch { return true; }
  });

  useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener("elevoni-cookie-settings", open);
    if (hasAnalyticsConsent()) enableAnalytics();
    return () => window.removeEventListener("elevoni-cookie-settings", open);
  }, []);

  const choose = (value) => {
    try { window.localStorage.setItem("elevoni-cookie-consent", value); } catch {}
    setVisible(false);
    if (value === "accepted") {
      enableAnalytics();
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });
      window.dispatchEvent(new Event("elevoni-analytics-consent"));
    } else {
      disableAnalytics();
    }
  };

  if (!visible) return null;
  return (
    <aside className="elevoni-cookie-consent" role="dialog" aria-label="Cookie preferences" aria-live="polite">
      <div className="elevoni-cookie-copy">
        <strong>Privacy and cookie choices</strong>
        <p>Essential storage keeps Elevoni working. Optional analytics helps us understand site usage and stays off unless you accept. Read our <a href="/cookies">Cookie Policy</a> and <a href="/privacy">Privacy Policy</a>.</p>
      </div>
      <div className="elevoni-cookie-actions">
        <button type="button" className="elevoni-cookie-reject" onClick={() => choose("rejected")}>Reject optional</button>
        <button type="button" className="elevoni-cookie-accept" onClick={() => choose("accepted")}>Accept analytics</button>
      </div>
    </aside>
  );
}

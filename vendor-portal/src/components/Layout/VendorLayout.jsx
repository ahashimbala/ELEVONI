import { Link, NavLink, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/auth-context";
import logo from "../../assets/elevoni-logo.png";
import "./VendorLayout.css";

const navigation = [
  { to: "/", label: "Home", shortLabel: "Home", icon: "⌂", end: true },
  { to: "/sales", label: "Sales log", shortLabel: "Sales", icon: "▤" },
  { to: "/n-atlas", label: "N-ATLAS", shortLabel: "N-ATLAS", icon: "✧" },
  { to: "/apply", label: "Application", shortLabel: "Apply", icon: "＋" },
  { to: "/login", label: "Account", shortLabel: "Account", icon: "◎" },
];

const VendorLayout = () => {
  const { isAuthenticated, signOut } = useContext(AuthContext);

  return (
    <div className="vendor-app">
      <header className="vendor-header">
        <div className="vendor-header-inner">
          <Link to="/" className="vendor-brand" aria-label="Elevoni Vendor Portal home">
            <img src={logo} alt="Elevoni Farms" className="vendor-brand-logo" />
            <span className="vendor-brand-divider" aria-hidden="true" />
            <span className="vendor-brand-sub">Vendor portal</span>
          </Link>
          <nav className="vendor-nav" aria-label="Vendor portal navigation">
            {navigation.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : undefined)}>
                {to === "/login" && isAuthenticated ? "Account" : to === "/login" ? "Sign in" : label}
              </NavLink>
            ))}
          </nav>
          <div className="vendor-header-actions">
            <a className="vendor-storefront-link" href="https://elevonifarms.vercel.app/marketplace" target="_blank" rel="noopener noreferrer">View marketplace <span aria-hidden="true">↗</span></a>
            {isAuthenticated && <button type="button" className="vendor-signout" onClick={signOut}>Sign out</button>}
          </div>
        </div>
      </header>
      <main className="vendor-main"><Outlet /></main>
      <footer className="vendor-footer">
        <div className="vendor-footer-inner">
          <p>Elevoni Farms <span aria-hidden="true">·</span> Vendor workspace</p>
          <p className="vendor-footer-note">Vendor approval and product-listing approval are separate. A listing is not a completed order.</p>
        </div>
      </footer>
      <nav className="vendor-mobile-nav" aria-label="Vendor app navigation">
        {navigation.map(({ to, shortLabel, icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `vendor-mobile-nav-item${isActive ? " active" : ""}`}>
            <span className="vendor-mobile-nav-icon" aria-hidden="true">{icon}</span>
            <span>{to === "/login" && isAuthenticated ? "Account" : shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default VendorLayout;

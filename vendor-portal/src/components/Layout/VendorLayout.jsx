import { Link, NavLink, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/auth-context";
import logo from "../../assets/elevoni-logo.png";
import "./VendorLayout.css";

const HomeIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 3 2.5 11h2.2v9h5.4v-5.8h3.8V20h5.4v-9h2.2L12 3z" /></svg>;
const SalesIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h7v-2H7z" /></svg>;
const AssistantIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4zm-7 9a1 1 0 0 1 1 1 6 6 0 0 0 12 0 1 1 0 1 1 2 0 8 8 0 0 1-7 7.94V22h-2v-2.06A8 8 0 0 1 4 12a1 1 0 0 1 1-1z" /></svg>;
const ApplyIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8z" /></svg>;
const AccountIcon = (props) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 0 1 12 6zm0 13.8a7.8 7.8 0 0 1-6.1-2.9c.6-2.2 2.6-3.7 6.1-3.7s5.5 1.5 6.1 3.7a7.8 7.8 0 0 1-6.1 2.9z" /></svg>;

const navigation = [
  { to: "/", label: "Home", shortLabel: "Home", icon: HomeIcon, end: true },
  { to: "/sales", label: "Sales log", shortLabel: "Sales", icon: SalesIcon },
  { to: "/assistant", label: "Elevoni Assistant", shortLabel: "Assistant", icon: AssistantIcon },
  { to: "/apply", label: "Application", shortLabel: "Apply", icon: ApplyIcon },
  { to: "/login", label: "Account", shortLabel: "Account", icon: AccountIcon },
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
          <div className="vendor-footer-brand">
            <p>Elevoni Farms <span aria-hidden="true">·</span> Vendor workspace</p>
            <p className="vendor-powered-by">AI by <strong>OpenAI</strong> <span aria-hidden="true">·</span> Voice by <strong>ElevenLabs</strong></p>
          </div>
          <p className="vendor-footer-note">Vendor approval and listing approval are separate.</p>
        </div>
      </footer>
      <nav className="vendor-mobile-nav" aria-label="Vendor app navigation">
        {navigation.map(({ to, shortLabel, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `vendor-mobile-nav-item${isActive ? " active" : ""}`}>
            <Icon className="vendor-mobile-nav-icon" aria-hidden="true" />
            <span>{to === "/login" && isAuthenticated ? "Account" : shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default VendorLayout;
